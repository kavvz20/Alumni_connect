// Must match the canonical department names in backend/src/config/institution.js
export const DEPARTMENTS = [
  "Computer Engineering",
  "Electronics & Communication Engineering",
  "Electronics & Instrumentation Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Management",
];

export const VERIFICATION_STATUS = {
  pending: { label: "Pending verification", badge: "badge-amber" },
  needs_manual_review: { label: "Needs manual review", badge: "badge-amber" },
  verified: { label: "Verified alumnus", badge: "badge-emerald" },
  rejected: { label: "Verification rejected", badge: "badge-rose" },
};

/** Status for any user object, including records created before verification statuses existed. */
export const getVerificationStatus = (user) =>
  user?.verification?.status || (user?.isVerified ? "verified" : "pending");

export const SCORE_DISCLAIMER =
  "The confidence score shows how well the profile is supported by the LinkedIn PDF and institutional records. It helps the admin review; a high score alone does not prove someone is a genuine alumnus, and only an admin can verify.";
