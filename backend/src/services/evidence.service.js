import jwt from "jsonwebtoken";
import { getJwtSecret } from "./auth.service.js";

/**
 * LinkedIn evidence tokens.
 *
 * When the server parses a LinkedIn PDF it signs the parse result into a short-lived token.
 * The client sends the token back when saving / registering / onboarding, and the server stores
 * ITS OWN parse result as verification evidence. This means a browser cannot submit made-up
 * "extracted" data, while users remain free to edit their visible profile fields.
 */

const AUDIENCE = "linkedin-evidence";
const TTL = "24h";

// Profile fields that may be copied from evidence into a profile (only when actually found/inferred).
const PROFILE_FIELDS = ["name", "currentCompany", "currentRole", "branch", "batch", "skills", "experience", "linkedinUrl"];

export const signEvidenceToken = ({ source, extracted, fileHash, issuedTo }) =>
  jwt.sign(
    { source, extracted, fileHash, issuedTo: issuedTo ? String(issuedTo) : null },
    getJwtSecret(),
    { audience: AUDIENCE, expiresIn: TTL }
  );

/**
 * Verifies an evidence token. `actorId` is the logged-in user submitting it (null during sign-up).
 * Tokens issued to a logged-in user can only be used by that same user.
 */
export const verifyEvidenceToken = (token, actorId = null) => {
  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret(), { audience: AUDIENCE });
  } catch (_) {
    const err = new Error("The LinkedIn PDF upload has expired or is invalid. Please upload the PDF again.");
    err.status = 400;
    throw err;
  }
  if (payload.issuedTo && String(payload.issuedTo) !== String(actorId || "")) {
    const err = new Error("This LinkedIn PDF upload belongs to a different session. Please upload it again.");
    err.status = 403;
    throw err;
  }
  return payload;
};

/** Shape stored at user.verification.evidence */
export const buildEvidenceRecord = (payload, submittedBy = null) => {
  const { fieldsFound = [], fieldsInferred = [], ...extracted } = payload.extracted || {};
  return {
    source: payload.source,
    extracted,
    fieldsFound,
    fieldsInferred,
    fileHash: payload.fileHash || undefined,
    extractedAt: payload.iat ? new Date(payload.iat * 1000) : new Date(),
    submittedBy: submittedBy || undefined,
  };
};

/** Profile values from evidence, skipping placeholder defaults the parser uses for form pre-fill. */
export const profileFieldsFromEvidence = (evidence) => {
  const usable = new Set([...(evidence.fieldsFound || []), ...(evidence.fieldsInferred || [])]);
  const out = {};
  for (const key of PROFILE_FIELDS) {
    if (usable.has(key) && evidence.extracted?.[key] !== undefined) out[key] = evidence.extracted[key];
  }
  if (usable.has("education") && Array.isArray(evidence.extracted?.education)) {
    out.education = evidence.extracted.education;
  }
  return out;
};
