import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/index.js";
import { sendCredentialsEmail } from "../services/email.service.js";
import { isAuthorizedAdmin, toSafeUser } from "../services/auth.service.js";
import { buildEvidenceRecord, profileFieldsFromEvidence, verifyEvidenceToken } from "../services/evidence.service.js";
import {
  applyEvidenceToken,
  findLinkedinOwner,
  flagIfDuplicateLinkedin,
  normalizeLinkedinUrl,
  sanitizeEducation,
} from "../services/alumni-profile.service.js";
import { matchDepartment } from "../config/institution.js";
import { recordDecision } from "./verification.controller.js";

// Profile fields an admin may fill in when onboarding an alumnus.
const ENRICHMENT_FIELDS = [
  "currentCompany",
  "currentRole",
  "industry",
  "branch",
  "batch",
  "skills",
  "areasOfExpertise",
  "bio",
  "experience",
  "education",
];

/** Facts the admin supplies from institutional records (kept separately from editable profile fields). */
const adminRecordFrom = (src = {}) => {
  const batch = Number(src.batch);
  const branchText = String(src.branch || "").trim();
  const record = {
    batch: Number.isInteger(batch) && batch > 1900 ? batch : undefined,
    branch: branchText ? matchDepartment(branchText) || branchText : undefined,
    degree: String(src.degree || "").trim() || undefined,
  };
  return record.batch || record.branch || record.degree ? record : undefined;
};

const isValidId = (id) => mongoose.isValidObjectId(id);

const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    // Alumni with unfinished profiles are only visible to the admin
    if (!isAuthorizedAdmin(req.user)) {
      filter.$or = [{ role: { $ne: "alumni" } }, { profileCompleted: true }];
    }

    const users = await User.find(filter)
      .select("-password -firebaseUid -__v -verification.evidence -verification.flags -verification.adminRecord -linkedinAccount.sub -linkedinAccount.email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: users.map((u) => ({ ...u.toObject(), isAdmin: isAuthorizedAdmin(u) })),
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch users list.",
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId)) {
      return res.status(400).json({
        success: false,
        message: "userId must be a valid ID.",
      });
    }

    const user = await User.findById(userId).select("-password -firebaseUid -__v -verification.evidence -verification.flags -verification.adminRecord -linkedinAccount.sub -linkedinAccount.email");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // An alumnus with an unfinished profile is hidden from everyone except themselves and the admin
    const isSelf = req.user && req.user._id.equals(user._id);
    const hidden = user.role === "alumni" && !user.profileCompleted && !isSelf && !isAuthorizedAdmin(req.user);
    if (hidden) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch user profile.",
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const isSelf = req.user._id.toString() === String(userId);

    if (!isValidId(userId)) {
      return res.status(400).json({
        success: false,
        message: "userId must be a valid ID.",
      });
    }

    // Only the user themselves or an admin can update the profile
    if (!isSelf && !isAuthorizedAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const allowedUpdates = [
      "name",
      "branch",
      "batch",
      "skills",
      "linkedinUrl",
      "githubUrl",
      "bio",
      "currentCompany",
      "currentRole",
      "industry",
      "areasOfExpertise",
      "experience",
      "availableForMentorshipCalls",
      "willingToRefer",
      "careerGoal",
      "resumeUrl",
      "profilePicture",
    ];

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        user[key] = req.body[key];
      }
    }

    if (user.role === "alumni") {
      if (req.body.education !== undefined) user.education = sanitizeEducation(req.body.education);

      // LinkedIn PDF evidence: the server stores its own signed parse result, not form values.
      if (req.body.evidenceToken) {
        try {
          applyEvidenceToken(user, req.body.evidenceToken, req.user._id);
        } catch (err) {
          return res.status(err.status || 400).json({ success: false, message: err.message });
        }
      }

      // A LinkedIn profile already used by another account goes to manual review (never silently merged).
      if (user.isModified("linkedinUrl")) await flagIfDuplicateLinkedin(user);
    }

    // Password set / change. Users changing their OWN existing password must confirm the current one.
    // Google-only users (no password yet) can set one; admins can reset other users' passwords.
    const newPassword = String(req.body.newPassword || req.body.password || "").trim();
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long.",
        });
      }
      if (isSelf && user.password) {
        const isMatch = req.body.currentPassword
          ? await bcrypt.compare(String(req.body.currentPassword), user.password)
          : false;
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: "Current password is incorrect.",
          });
        }
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: toSafeUser(user),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: Object.values(error.errors)[0]?.message || error.message });
    }
    console.error("Update user profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
};

const verifyAlumni = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified = true } = req.body;

    if (!isValidId(userId)) {
      return res.status(400).json({
        success: false,
        message: "userId must be a valid ID.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role !== "alumni") {
      return res.status(400).json({
        success: false,
        message: "Only alumni profiles can be verified.",
      });
    }

    // Same logged decision path as the verification dashboard (revoking returns the profile to pending).
    const updated = await recordDecision({
      userId: user._id,
      decision: isVerified ? "verified" : "pending",
      note: isVerified ? undefined : "Verified badge revoked by admin.",
      admin: req.user,
    });
    user.isVerified = updated.isVerified;

    return res.status(200).json({
      success: true,
      message: `Alumni verification status updated to ${user.isVerified}.`,
      data: {
        userId: user._id,
        name: user.name,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Verify alumni error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update alumni verification status.",
    });
  }
};

const onboardUser = async (req, res) => {
  try {

    const { role, name, email, linkedinUrl } = req.body;

    if (!role || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "role, name, and email are required.",
      });
    }

    if (!["student", "alumni"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either 'student' or 'alumni'.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A user with email ${normalizedEmail} already exists.`,
      });
    }

    // One alumni record per LinkedIn profile
    if (role === "alumni" && linkedinUrl?.trim()) {
      const owner = await findLinkedinOwner(linkedinUrl);
      if (owner) {
        return res.status(409).json({
          success: false,
          message: `This LinkedIn profile is already linked to ${owner.name} (${owner.email}).`,
        });
      }
    }

    // LinkedIn PDF uploaded by the admin: use the server-signed parse result (found/inferred fields only).
    let evidenceRecord = null;
    if (role === "alumni" && req.body.evidenceToken) {
      try {
        evidenceRecord = buildEvidenceRecord(verifyEvidenceToken(req.body.evidenceToken, req.user._id), req.user._id);
      } catch (err) {
        return res.status(err.status || 400).json({ success: false, message: err.message });
      }
    }

    let alumniEnrichment = {};
    if (role === "alumni") {
      if (evidenceRecord) {
        const { name: _ignoredName, linkedinUrl: _ignoredUrl, ...fromEvidence } = profileFieldsFromEvidence(evidenceRecord);
        alumniEnrichment = fromEvidence;
      } else {
        for (const key of ENRICHMENT_FIELDS) {
          if (req.body.enrichmentData?.[key] !== undefined) alumniEnrichment[key] = req.body.enrichmentData[key];
        }
      }
      for (const key of ENRICHMENT_FIELDS) {
        if (req.body[key] !== undefined && req.body[key] !== "") alumniEnrichment[key] = req.body[key];
      }
      if (alumniEnrichment.education) alumniEnrichment.education = sanitizeEducation(alumniEnrichment.education);
    }

    const newUser = await User.create({
      ...alumniEnrichment,
      role,
      name: name.trim(),
      email: normalizedEmail,
      // No password: the person signs in with Google using this email, which proves it is theirs.
      linkedinUrl: role === "alumni" && linkedinUrl ? linkedinUrl.trim() : undefined,
      profileSource: "admin_manual",
      ...(role === "alumni" && {
        verification: {
          status: "pending", // alumni start pending admin verification
          evidence: evidenceRecord || undefined,
          adminRecord: adminRecordFrom(req.body),
        },
      }),
    });

    // Send email dispatch
    await sendCredentialsEmail({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    const safeUser = newUser.toObject();
    delete safeUser.password;
    delete safeUser.firebaseUid;
    delete safeUser.__v;

    return res.status(201).json({
      success: true,
      message: `Account for ${newUser.name} created. They sign in with Google using ${newUser.email}.`,
      data: {
        user: safeUser,
        filledFromLinkedinPdf: Boolean(evidenceRecord),
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: Object.values(error.errors)[0]?.message || error.message });
    }
    console.error("Onboard user error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to onboard user.",
    });
  }
};

const bulkOnboardUsers = async (req, res) => {
  try {

    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "users array is required.",
      });
    }

    const created = [];
    const duplicates = [];

    for (const record of users) {
      const name = record.name?.trim();
      const email = record.email?.trim().toLowerCase();
      let role = record.role?.trim().toLowerCase();
      if (!role || !["student", "alumni"].includes(role)) {
        role = "student";
      }

      if (!name || !email) {
        continue;
      }

      const existing = await User.findOne({ email });
      if (existing) {
        duplicates.push({ email, name, role, reason: "Email already registered" });
        continue;
      }

      // LinkedIn URLs are stored on the record (and checked against the alumnus's own PDF later), not fetched.
      const cleanLinkedin = role === "alumni" && record.linkedinUrl ? record.linkedinUrl.trim() : undefined;

      if (cleanLinkedin) {
        if (!normalizeLinkedinUrl(cleanLinkedin)) {
          duplicates.push({ email, name, role, reason: "Invalid LinkedIn profile URL" });
          continue;
        }
        const owner = await findLinkedinOwner(cleanLinkedin);
        if (owner) {
          duplicates.push({ email, name, role, reason: `LinkedIn profile already linked to ${owner.email}` });
          continue;
        }
      }

      // Optional institutional columns from the CSV (batch, branch, degree)
      const adminRecord = role === "alumni" ? adminRecordFrom(record) : undefined;

      // Optional profile columns provided by the admin in the CSV
      const csvProfile = {};
      if (role === "alumni") {
        for (const key of ["currentCompany", "currentRole", "industry", "bio"]) {
          const value = typeof record[key] === "string" ? record[key].trim() : "";
          if (value) csvProfile[key] = value;
        }
      }

      let newUser;
      try {
        newUser = await User.create({
          ...csvProfile,
          role,
          name,
          email,
          // No password: they sign in with Google using this email.
          linkedinUrl: cleanLinkedin,
          profileSource: "admin_csv",
          ...(adminRecord?.batch && { batch: adminRecord.batch }),
          ...(adminRecord?.branch && { branch: adminRecord.branch }),
          ...(role === "alumni" && { verification: { status: "pending", adminRecord } }),
        });
      } catch (rowError) {
        duplicates.push({ email, name, role, reason: rowError.name === "ValidationError" ? "Invalid data in row" : "Could not create account" });
        continue;
      }

      await sendCredentialsEmail({ name, email, role });

      created.push({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        currentCompany: newUser.currentCompany,
        currentRole: newUser.currentRole,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Bulk onboarding complete: ${created.length} created, ${duplicates.length} skipped.`,
      data: {
        totalProcessed: users.length,
        createdCount: created.length,
        duplicateCount: duplicates.length,
        created,
        duplicates,
      },
    });
  } catch (error) {
    console.error("Bulk onboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process bulk onboarding.",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId)) {
      return res.status(400).json({
        success: false,
        message: "userId must be a valid ID.",
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (targetUser.role === "admin" || isAuthorizedAdmin(targetUser)) {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be deleted.",
      });
    }

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: `Account for ${targetUser.name} (${targetUser.role}) has been permanently deleted.`,
      data: {
        userId,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete user account.",
    });
  }
};

export {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  verifyAlumni,
  onboardUser,
  bulkOnboardUsers,
  deleteUser,
};
