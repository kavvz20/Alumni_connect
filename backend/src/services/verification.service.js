import { INSTITUTION, isInstitutionName, matchDegree, matchDepartment } from "../config/institution.js";
import { isInstitutionalEmail } from "./auth.service.js";
import { getActiveModel } from "./ml-model.service.js";

/**
 * Alumni verification: features + checks + rule-based evidence score.
 *
 * Inputs (never trusted equally):
 *   - evidence    : the server's own parse of the alumnus's LinkedIn PDF (verification.evidence)
 *   - adminRecord : facts the admin entered from institutional records (manual form / CSV)
 *   - profile     : what the user typed in their profile (self-reported)
 *
 * IMPORTANT: the rule-based score is NOT a machine-learning prediction. It measures how much
 * independent evidence supports the profile. A trained model replaces it in Phase 4, using the
 * same `features` and the admin decisions stored in VerificationDecision as labels.
 */

export const FEATURE_VERSION = 1;
export const RULE_SCORE_VERSION = "rules-v1";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const normName = (s = "") =>
  String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0 && !["mr", "ms", "mrs", "dr", "er"].includes(t));

/**
 * Token-based name similarity in [0, 1]. Handles reordering, initials ("A. Sharma") and
 * single-name LinkedIn profiles ("Rachana") without heavy dependencies.
 */
export const nameSimilarity = (a, b) => {
  const ta = normName(a);
  const tb = normName(b);
  if (!ta.length || !tb.length) return null;
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  let matched = 0;
  const used = new Set();
  for (const t of short) {
    const idx = long.findIndex(
      (u, i) => !used.has(i) && (u === t || (t.length === 1 && u.startsWith(t)) || (u.length === 1 && t.startsWith(u)))
    );
    if (idx !== -1) {
      used.add(idx);
      matched += t.length === 1 || long[idx].length === 1 ? 0.5 : 1;
    }
  }
  // All tokens of the shorter name present = strong match, scaled slightly by length difference.
  return Math.round((matched / short.length) * (0.8 + 0.2 * (short.length / long.length)) * 100) / 100;
};

const handleFromUrl = (url = "") => (String(url).match(/linkedin\.com\/in\/([^/?#]+)/i) || [])[1] || "";
const handleToName = (handle = "") =>
  decodeURIComponent(handle)
    .replace(/[-_]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\b[a-f0-9]{6,}\b/gi, " ")
    .trim();

const sameLinkedin = (a, b) => {
  const ha = handleFromUrl(a).toLowerCase();
  const hb = handleFromUrl(b).toLowerCase();
  return ha && hb ? ha === hb : null;
};

const yearOrNull = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 1900 ? n : null;
};

const bool = (v) => (v === null || v === undefined ? null : v ? 1 : 0);

// ---------------------------------------------------------------------------
// Feature extraction (shared by the rule score and the ML model)
// ---------------------------------------------------------------------------
export const extractFeatures = (user, now = new Date()) => {
  const currentYear = now.getFullYear();
  const evidence = user.verification?.evidence?.source ? user.verification.evidence : null;
  const ex = evidence?.extracted || {};
  const found = new Set([...(evidence?.fieldsFound || [])]);
  const adminRecord = user.verification?.adminRecord || {};

  const evidenceEducation = Array.isArray(ex.education) ? ex.education : [];
  const instEntry = evidenceEducation.find((e) => isInstitutionName(e.institution)) || null;
  const profileInstEntry = (user.education || []).find((e) => isInstitutionName(e.institution)) || null;

  const evDegree = instEntry ? matchDegree(instEntry.degree) : null;
  const evDept = instEntry ? matchDepartment(instEntry.fieldOfStudy) || matchDepartment(instEntry.degree) : null;
  const evGradYear = instEntry ? yearOrNull(instEntry.endYear) : null;
  const evStartYear = instEntry ? yearOrNull(instEntry.startYear) : null;

  const profileBatch = yearOrNull(user.batch);
  const profileDept = matchDepartment(user.branch) || (user.branch ? String(user.branch) : null);
  const adminBatch = yearOrNull(adminRecord.batch);
  const adminDept = adminRecord.branch ? matchDepartment(adminRecord.branch) || adminRecord.branch : null;
  const adminDegree = adminRecord.degree ? matchDegree(adminRecord.degree) : null;

  const duration = evGradYear && evStartYear ? evGradYear - evStartYear : null;
  const expectedDuration = evDegree?.years ?? null;

  const evName = found.has("name") ? ex.name : null;
  const handleName = handleToName(handleFromUrl(user.linkedinUrl));

  const flags = user.verification?.flags || [];

  const profileFields = [user.name, user.linkedinUrl, user.batch, user.branch, user.currentCompany, user.currentRole];
  const completeness =
    (profileFields.filter(Boolean).length + ((user.education || []).length ? 1 : 0) + (evidence ? 1 : 0)) /
    (profileFields.length + 2);

  return {
    version: FEATURE_VERSION,
    values: {
      has_evidence: bool(Boolean(evidence)),
      evidence_has_education: evidence ? bool(evidenceEducation.length > 0) : null,
      evidence_institution_match: evidence ? bool(Boolean(instEntry)) : null,
      profile_institution_match: bool(Boolean(profileInstEntry)),
      degree_recognised: instEntry ? bool(Boolean(evDegree)) : null,
      degree_level: evDegree ? { bachelor: 1, master: 2, doctorate: 3 }[evDegree.level] : null,
      department_recognised: instEntry ? bool(Boolean(evDept)) : null,
      grad_year_plausible: evGradYear ? bool(evGradYear >= INSTITUTION.foundedYear && evGradYear <= currentYear) : null,
      years_since_graduation: evGradYear ? currentYear - evGradYear : null,
      duration_years: duration,
      duration_diff: duration !== null && expectedDuration !== null ? Math.abs(duration - expectedDuration) : null,
      profile_batch_matches_evidence: evGradYear && profileBatch ? bool(evGradYear === profileBatch) : null,
      profile_dept_matches_evidence: evDept && profileDept ? bool(evDept === profileDept) : null,
      has_admin_record: bool(Boolean(adminBatch || adminDept || adminDegree)),
      admin_batch_matches_evidence: adminBatch && evGradYear ? bool(adminBatch === evGradYear) : null,
      admin_dept_matches_evidence: adminDept && evDept ? bool(adminDept === evDept) : null,
      admin_degree_matches_evidence: adminDegree && evDegree ? bool(adminDegree.code === evDegree.code) : null,
      admin_batch_matches_profile: adminBatch && profileBatch ? bool(adminBatch === profileBatch) : null,
      name_similarity_evidence: evName ? nameSimilarity(user.name, evName) : null,
      name_similarity_handle: handleName ? nameSimilarity(user.name, handleName) : null,
      linkedin_url_matches_evidence:
        evidence && found.has("linkedinUrl") && user.linkedinUrl ? bool(sameLinkedin(ex.linkedinUrl, user.linkedinUrl)) : null,
      institutional_email: bool(isInstitutionalEmail(user.email)),
      possible_duplicate: bool(flags.some((f) => f.type === "possible_duplicate")),
      experience_count: Array.isArray(ex.experience) ? ex.experience.length : null,
      education_count: evidence ? evidenceEducation.length : null,
      skills_count: Array.isArray(ex.skills) ? ex.skills.length : null,
      completeness: Math.round(completeness * 100) / 100,
    },
    // Human-readable values for the checks (not used as model inputs)
    context: { instEntry, evDegree, evDept, evGradYear, evStartYear, profileBatch, profileDept, adminBatch, adminDept, adminDegree, evName, handleName, expectedDuration, currentYear },
  };
};

// ---------------------------------------------------------------------------
// Checks shown to admins (and, without admin-only details, to the alumnus)
// ---------------------------------------------------------------------------
const check = (key, label, weight, result, detail, { hard = false, publicDetail } = {}) => ({
  key,
  label,
  weight,
  result, // "match" | "mismatch" | "missing"
  hard, // a hard mismatch always sends the profile to manual review
  detail,
  publicDetail: publicDetail ?? detail,
});

export const buildChecks = (user, features) => {
  const v = features.values;
  const c = features.context;
  const checks = [];

  checks.push(
    v.has_evidence
      ? check("evidence", "LinkedIn PDF provided", 1, "match", "Profile PDF uploaded and parsed by the server.")
      : check("evidence", "LinkedIn PDF provided", 1, "missing", "No LinkedIn PDF uploaded yet, so nothing below can be checked against LinkedIn.")
  );

  if (v.evidence_institution_match === 1) {
    checks.push(check("institution", `${INSTITUTION.shortName} in LinkedIn education`, 3, "match", `Education lists "${c.instEntry.institution}".`));
  } else if (v.evidence_institution_match === 0) {
    checks.push(
      check("institution", `${INSTITUTION.shortName} in LinkedIn education`, 3, "mismatch",
        v.evidence_has_education ? "The LinkedIn education section does not list the institute." : "The LinkedIn PDF has no education section.",
        { hard: v.evidence_has_education === 1 })
    );
  } else {
    checks.push(check("institution", `${INSTITUTION.shortName} in LinkedIn education`, 3, "missing",
      v.profile_institution_match ? "Only self-reported in the profile form." : "Not available."));
  }

  if (v.degree_recognised === 1) checks.push(check("degree", "Degree recognised", 1, "match", `${c.instEntry.degree} → ${c.evDegree.code}.`));
  else if (v.degree_recognised === 0) checks.push(check("degree", "Degree recognised", 1, "mismatch", `"${c.instEntry.degree || "(blank)"}" is not a degree the institute awards.`));
  else checks.push(check("degree", "Degree recognised", 1, "missing", "No degree found in the institute's education entry."));

  if (v.grad_year_plausible === 0) {
    checks.push(check("grad_year", "Graduation year plausible", 2, "mismatch",
      c.evGradYear > c.currentYear ? `Graduation year ${c.evGradYear} is in the future (still a student?).` : `Graduation year ${c.evGradYear} is before the institute was founded.`,
      { hard: true }));
  } else if (v.grad_year_plausible === 1) {
    checks.push(check("grad_year", "Graduation year plausible", 2, "match", `Graduated ${c.evGradYear}.`));
  } else {
    checks.push(check("grad_year", "Graduation year plausible", 2, "missing", "No graduation year in the LinkedIn education entry."));
  }

  if (v.duration_diff === null) {
    checks.push(check("duration", "Course duration consistent", 1, "missing", "Start or end year, or degree type, not available."));
  } else if (v.duration_diff <= 1) {
    checks.push(check("duration", "Course duration consistent", 1, "match", `${v.duration_years} years for ${c.evDegree.code} (normally ${c.expectedDuration}).`));
  } else {
    checks.push(check("duration", "Course duration consistent", 1, "mismatch", `${v.duration_years} years for ${c.evDegree.code} (normally ${c.expectedDuration}).`));
  }

  // Graduation year: evidence vs profile vs admin record
  const batchParts = [];
  let batchResult = "missing";
  if (v.profile_batch_matches_evidence !== null) {
    batchResult = v.profile_batch_matches_evidence ? "match" : "mismatch";
    batchParts.push(`profile ${c.profileBatch} vs LinkedIn ${c.evGradYear}`);
  }
  if (v.admin_batch_matches_evidence !== null) {
    if (!v.admin_batch_matches_evidence) batchResult = "mismatch";
    else if (batchResult === "missing") batchResult = "match";
    batchParts.push(`institution record ${c.adminBatch} vs LinkedIn ${c.evGradYear}`);
  } else if (v.admin_batch_matches_profile !== null && batchResult === "missing") {
    batchResult = v.admin_batch_matches_profile ? "match" : "mismatch";
    batchParts.push(`institution record ${c.adminBatch} vs profile ${c.profileBatch}`);
  }
  checks.push(check("batch_consistent", "Graduation year consistent", 2, batchResult,
    batchParts.length ? batchParts.join("; ") + "." : "Nothing to compare yet.",
    { hard: v.admin_batch_matches_evidence === 0,
      publicDetail: batchResult === "mismatch" ? "Your graduation year does not match the other records we have." : batchResult === "match" ? "Your graduation year matches." : "Nothing to compare yet." }));

  // Department: evidence vs profile vs admin record
  const deptParts = [];
  let deptResult = "missing";
  if (v.profile_dept_matches_evidence !== null) {
    deptResult = v.profile_dept_matches_evidence ? "match" : "mismatch";
    deptParts.push(`profile "${c.profileDept}" vs LinkedIn "${c.evDept}"`);
  }
  if (v.admin_dept_matches_evidence !== null) {
    if (!v.admin_dept_matches_evidence) deptResult = "mismatch";
    else if (deptResult === "missing") deptResult = "match";
    deptParts.push(`institution record "${c.adminDept}" vs LinkedIn "${c.evDept}"`);
  }
  checks.push(check("dept_consistent", "Department consistent", 1, deptResult,
    deptParts.length ? deptParts.join("; ") + "." : "Department not found in LinkedIn education.",
    { publicDetail: deptResult === "mismatch" ? "Your department does not match the other records we have." : deptResult === "match" ? "Your department matches." : "Department not found in LinkedIn education." }));

  if (v.admin_degree_matches_evidence !== null) {
    checks.push(check("degree_record", "Degree matches institution record", 1, v.admin_degree_matches_evidence ? "match" : "mismatch",
      `Institution record ${c.adminDegree.code} vs LinkedIn ${c.evDegree.code}.`,
      { publicDetail: v.admin_degree_matches_evidence ? "Your degree matches." : "Your degree does not match the institution's record." }));
  }

  // Name
  if (v.name_similarity_evidence === null) {
    checks.push(check("name", "Name matches LinkedIn", 2, "missing", "No name found in the LinkedIn PDF."));
  } else {
    const ok = v.name_similarity_evidence >= 0.6;
    checks.push(check("name", "Name matches LinkedIn", 2, ok ? "match" : "mismatch",
      `Account "${user.name}" vs LinkedIn "${c.evName}" (similarity ${Math.round(v.name_similarity_evidence * 100)}%).`));
  }

  // LinkedIn URL in profile vs URL printed in the PDF
  if (v.linkedin_url_matches_evidence === 1) {
    checks.push(check("linkedin_url", "PDF belongs to the given LinkedIn profile", 2, "match", "The URL printed in the PDF matches the profile URL."));
  } else if (v.linkedin_url_matches_evidence === 0) {
    checks.push(check("linkedin_url", "PDF belongs to the given LinkedIn profile", 2, "mismatch",
      `PDF is for ${user.verification.evidence.extracted.linkedinUrl}, profile says ${user.linkedinUrl}.`,
      { hard: true, publicDetail: "The uploaded PDF is for a different LinkedIn profile than the URL in your profile." }));
  } else {
    checks.push(check("linkedin_url", "PDF belongs to the given LinkedIn profile", 2, "missing", "No URL to compare."));
  }

  if (v.institutional_email === 1) {
    checks.push(check("email", `Institutional email (@${INSTITUTION.emailDomain})`, 2, "match", `Signed in with ${user.email}.`));
  }

  if (v.possible_duplicate === 1) {
    const flag = (user.verification.flags || []).find((f) => f.type === "possible_duplicate");
    checks.push(check("duplicate", "LinkedIn profile not used by another account", 2, "mismatch", flag?.detail || "Possible duplicate account.",
      { hard: true, publicDetail: "This LinkedIn profile is also linked to another account." }));
  }

  return checks;
};

/**
 * Rule-based evidence score in [0, 1]:
 *   sum(weights of matching checks) / sum(weights of all checks).
 * Missing evidence lowers the score; it is never treated as proof either way.
 */
export const ruleScore = (checks) => {
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const matched = checks.filter((c) => c.result === "match").reduce((s, c) => s + c.weight, 0);
  return total ? Math.round((matched / total) * 100) / 100 : 0;
};

/**
 * Computes features, checks and score for an alumni document and stores them on it.
 * Status is only moved between "pending" and "needs_manual_review"; only an admin
 * can set "verified" or "rejected".
 */
export const scoreAlumnus = (user, { now = new Date(), model = getActiveModel(FEATURE_VERSION) } = {}) => {
  if (user.role !== "alumni") return null;

  const features = extractFeatures(user, now);
  const checks = buildChecks(user, features);
  const hardMismatch = checks.some((c) => c.hard && c.result === "mismatch");

  const ruleValue = ruleScore(checks);
  let value = ruleValue;
  let method = "rule_based";
  let version = RULE_SCORE_VERSION;
  if (model?.predict) {
    // Calibrated ML probability from the same features (only when a sufficiently trained model is active)
    value = model.predict(features.values);
    method = "ml";
    version = model.version;
  }

  const suggestedStatus = hardMismatch ? "needs_manual_review" : "pending";

  user.verification = user.verification || { status: "pending" };
  user.verification.features = { version: features.version, values: features.values };
  user.verification.score = {
    value,
    method,
    version,
    ruleValue, // always kept so admins can compare the ML probability with the evidence score
    checks: checks.map(({ key, label, weight, result, hard, detail, publicDetail }) => ({
      key, label, weight, result, hard, detail, publicDetail,
    })),
    suggestedStatus,
    computedAt: now,
  };
  user.markModified("verification");

  // Automatic status changes go one way only: pending -> needs_manual_review.
  // Leaving manual review, verifying and rejecting are always admin decisions.
  const flagged = (user.verification.flags || []).length > 0;
  if (user.verification.status === "pending" && (hardMismatch || flagged)) {
    user.verification.status = "needs_manual_review";
  }

  return user.verification.score;
};
