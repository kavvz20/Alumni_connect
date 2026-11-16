import { User } from "../models/index.js";
import { sanitizeLinkedInUrl } from "./linkedin-scraper.service.js";
import { buildEvidenceRecord, verifyEvidenceToken } from "./evidence.service.js";

/** Same normalisation as the User model, for lookups before saving. */
export const normalizeLinkedinUrl = (url) => {
  const clean = sanitizeLinkedInUrl(url || "");
  return clean ? clean.toLowerCase() : null;
};

/** Another account already using this LinkedIn profile, if any. */
export const findLinkedinOwner = async (linkedinUrl, excludeUserId = null) => {
  const normalized = normalizeLinkedinUrl(linkedinUrl);
  if (!normalized) return null;
  const filter = { linkedinUrl: normalized };
  if (excludeUserId) filter._id = { $ne: excludeUserId };
  return User.findOne(filter).select("_id name email role firebaseUid profileSource");
};

/**
 * Self-service path: never block the save, but send the profile to manual review
 * and tell the admin which account it may duplicate.
 */
export const flagIfDuplicateLinkedin = async (user) => {
  if (user.role !== "alumni" || !user.linkedinUrl) return null;
  const owner = await findLinkedinOwner(user.linkedinUrl, user._id);
  if (!owner) return null;

  user.verification = user.verification || { status: "pending" };
  const already = (user.verification.flags || []).some(
    (f) => f.type === "possible_duplicate" && String(f.relatedUser) === String(owner._id)
  );
  if (!already) {
    user.verification.flags = [
      ...(user.verification.flags || []),
      {
        type: "possible_duplicate",
        detail: `LinkedIn profile is also used by ${owner.name} (${owner.email}, ${
          owner.profileSource === "admin_csv" || owner.profileSource === "admin_manual" ? "added by admin" : owner.role
        }).`,
        relatedUser: owner._id,
      },
    ];
  }
  if (user.verification.status !== "rejected") user.verification.status = "needs_manual_review";
  return owner;
};

/** Stores the server-signed LinkedIn PDF parse result as verification evidence. */
export const applyEvidenceToken = (user, evidenceToken, actorId = null) => {
  if (!evidenceToken || user.role !== "alumni") return false;
  const payload = verifyEvidenceToken(evidenceToken, actorId);
  user.verification = user.verification || { status: "pending" };
  user.verification.evidence = buildEvidenceRecord(payload, actorId);
  return true;
};

const toYear = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : undefined;
};

/** Cleans education rows coming from a form. */
export const sanitizeEducation = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => ({
      institution: String(r?.institution || "").trim().slice(0, 200),
      degree: String(r?.degree || "").trim().slice(0, 150),
      fieldOfStudy: String(r?.fieldOfStudy || "").trim().slice(0, 150),
      startYear: toYear(r?.startYear),
      endYear: toYear(r?.endYear),
    }))
    .filter((r) => r.institution || r.degree)
    .slice(0, 10);
};
