import mongoose from "mongoose";
import { User, VerificationDecision } from "../models/index.js";
import { VERIFICATION_STATUSES } from "../models/user.model.js";
import { FEATURE_VERSION, scoreAlumnus } from "../services/verification.service.js";
import { getModelStatus, loadModel } from "../services/ml-model.service.js";

// Must match ml/train.py (MIN_TOTAL / MIN_PER_CLASS)
const ML_MIN_TOTAL = 100;
const ML_MIN_PER_CLASS = 20;

const isValidId = (id) => mongoose.isValidObjectId(id);
const fail = (res, status, message) => res.status(status).json({ success: false, message });
const escapeRegex = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const QUEUE_FIELDS =
  "name email profilePicture linkedinUrl batch branch currentCompany currentRole education profileSource profileCompleted createdAt " +
  "verification.status verification.score.value verification.score.method verification.score.version " +
  "verification.score.suggestedStatus verification.flags verification.evidence.source verification.reviewedAt";

/** GET /api/v1/verification?status=open|pending|needs_manual_review|verified|rejected|all&search=&page=&limit= */
const getVerificationQueue = async (req, res) => {
  try {
    const { status = "open", search = "", page = 1, limit = 20 } = req.query;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const filter = { role: "alumni" };
    if (status === "open") filter["verification.status"] = { $in: ["pending", "needs_manual_review"] };
    else if (VERIFICATION_STATUSES.includes(status)) filter["verification.status"] = status;
    else if (status !== "all") return fail(res, 400, "Unknown status filter.");

    if (search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ name: rx }, { email: rx }, { currentCompany: rx }];
    }

    const [items, total, counts] = await Promise.all([
      User.find(filter)
        .select(QUEUE_FIELDS)
        .sort({ "verification.status": 1, createdAt: -1 }) // "needs_manual_review" sorts before "pending"
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      User.countDocuments(filter),
      User.aggregate([{ $match: { role: "alumni" } }, { $group: { _id: "$verification.status", n: { $sum: 1 } } }]),
    ]);

    const statusCounts = Object.fromEntries(VERIFICATION_STATUSES.map((s) => [s, 0]));
    for (const c of counts) if (c._id) statusCounts[c._id] = c.n;

    return res.status(200).json({
      success: true,
      data: items,
      counts: statusCounts,
      pagination: { page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("Verification queue error:", error);
    return fail(res, 500, "Unable to load the verification queue.");
  }
};

/** GET /api/v1/verification/:userId — everything the admin needs to decide */
const getVerificationDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) return fail(res, 400, "Invalid user ID.");

    const user = await User.findOne({ _id: userId, role: "alumni" })
      .select("-password -firebaseUid -__v")
      .populate("verification.flags.relatedUser", "name email profileSource")
      .populate("verification.reviewedBy", "name email");
    if (!user) return fail(res, 404, "Alumni profile not found.");

    const history = await VerificationDecision.find({ user: userId })
      .sort({ decidedAt: -1 })
      .limit(20)
      .select("decision note decidedAt scoreAtDecision scoreMethod")
      .populate("decidedBy", "name email");

    return res.status(200).json({ success: true, data: { user, history } });
  } catch (error) {
    console.error("Verification detail error:", error);
    return fail(res, 500, "Unable to load verification details.");
  }
};

/**
 * Records an admin decision. Recomputes the score first so the stored feature snapshot is current.
 * Exported for the legacy PATCH /users/:id/verify route.
 */
export const recordDecision = async ({ userId, decision, note, admin }) => {
  const user = await User.findOne({ _id: userId, role: "alumni" });
  if (!user) {
    const err = new Error("Alumni profile not found.");
    err.status = 404;
    throw err;
  }

  scoreAlumnus(user);
  const previousStatus = user.verification.status;

  await VerificationDecision.create({
    user: user._id,
    decision,
    label: decision === "verified" ? 1 : decision === "rejected" ? 0 : null,
    previousStatus,
    note,
    featureVersion: user.verification.features?.version,
    features: user.verification.features?.values,
    scoreAtDecision: user.verification.score?.value,
    scoreMethod: user.verification.score?.method,
    scoreVersion: user.verification.score?.version,
    profileSource: user.profileSource,
    evidenceSource: user.verification.evidence?.source,
    decidedBy: admin._id,
  });

  user.verification.status = decision;
  user.verification.reviewedBy = admin._id;
  user.verification.reviewedAt = new Date();
  user.verification.note = note || undefined;
  user.markModified("verification");
  await user.save();
  return user;
};

/** PATCH /api/v1/verification/:userId  { decision, note } */
const decideVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { decision } = req.body || {};
    const note = String(req.body?.note || "").trim().slice(0, 1000);

    if (!isValidId(userId)) return fail(res, 400, "Invalid user ID.");
    if (!VERIFICATION_STATUSES.includes(decision)) {
      return fail(res, 400, `decision must be one of: ${VERIFICATION_STATUSES.join(", ")}.`);
    }
    if (decision === "rejected" && !note) {
      return fail(res, 400, "Please give a reason when rejecting. The alumnus will see it.");
    }

    const user = await recordDecision({ userId, decision, note, admin: req.user });
    return res.status(200).json({
      success: true,
      message: `${user.name} marked as ${decision.replace(/_/g, " ")}.`,
      data: { userId: user._id, status: user.verification.status, isVerified: user.isVerified },
    });
  } catch (error) {
    if (error.status) return fail(res, error.status, error.message);
    console.error("Verification decision error:", error);
    return fail(res, 500, "Unable to save the verification decision.");
  }
};

/** POST /api/v1/verification/:userId/rescore */
const rescoreOne = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) return fail(res, 400, "Invalid user ID.");
    const user = await User.findOne({ _id: userId, role: "alumni" });
    if (!user) return fail(res, 404, "Alumni profile not found.");
    scoreAlumnus(user);
    await user.save();
    return res.status(200).json({ success: true, data: { status: user.verification.status, score: user.verification.score } });
  } catch (error) {
    console.error("Rescore error:", error);
    return fail(res, 500, "Unable to recompute the score.");
  }
};

/** POST /api/v1/verification/rescore-all — after changing rules, the institution config or the model */
const rescoreAll = async (req, res) => {
  try {
    const model = loadModel(FEATURE_VERSION); // pick up a newly trained model file
    let count = 0;
    for await (const user of User.find({ role: "alumni" })) {
      scoreAlumnus(user);
      await user.save();
      count++;
    }
    return res.status(200).json({
      success: true,
      message: `Recomputed scores for ${count} alumni using ${model.active ? `ML model ${model.model.version}` : "the rule-based evidence score"}.`,
    });
  } catch (error) {
    console.error("Rescore all error:", error);
    return fail(res, 500, "Unable to recompute scores.");
  }
};

/** GET /api/v1/verification/me — the alumnus's own status, score and checks (no admin-only details) */
const getMyVerification = async (req, res) => {
  if (req.user.role !== "alumni") return fail(res, 403, "Only alumni have a verification status.");
  const v = req.user.verification || {};
  return res.status(200).json({
    success: true,
    data: {
      status: v.status || "pending",
      note: v.status === "rejected" ? v.note : undefined,
      score: v.score
        ? {
            value: v.score.value,
            method: v.score.method,
            version: v.score.version,
            computedAt: v.score.computedAt,
            checks: (v.score.checks || []).map((c) => ({ key: c.key, label: c.label, result: c.result, detail: c.publicDetail })),
          }
        : null,
    },
  });
};

/** GET /api/v1/verification/model — which scoring method is active and how much labelled data exists */
const getModelInfo = async (req, res) => {
  try {
    const latest = await VerificationDecision.aggregate([
      { $match: { label: { $in: [0, 1] } } },
      { $sort: { decidedAt: -1 } },
      { $group: { _id: "$user", label: { $first: "$label" } } },
      { $group: { _id: "$label", n: { $sum: 1 } } },
    ]);
    const verified = latest.find((l) => l._id === 1)?.n || 0;
    const rejected = latest.find((l) => l._id === 0)?.n || 0;
    return res.status(200).json({
      success: true,
      data: {
        ...getModelStatus(FEATURE_VERSION),
        featureVersion: FEATURE_VERSION,
        labels: {
          total: verified + rejected,
          verified,
          rejected,
          minimumTotal: ML_MIN_TOTAL,
          minimumPerClass: ML_MIN_PER_CLASS,
          readyToTrain: verified + rejected >= ML_MIN_TOTAL && Math.min(verified, rejected) >= ML_MIN_PER_CLASS,
        },
      },
    });
  } catch (error) {
    console.error("Model info error:", error);
    return fail(res, 500, "Unable to load model information.");
  }
};

export { getModelInfo, getVerificationQueue, getVerificationDetail, decideVerification, rescoreOne, rescoreAll, getMyVerification };
