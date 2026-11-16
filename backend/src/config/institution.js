/**
 * Institution reference data used by the LinkedIn parser and (Phase 3) alumni verification.
 * Edit this file to match the institution's official department and degree lists.
 */

export const INSTITUTION = {
  name: "Thapar Institute of Engineering & Technology",
  shortName: "TIET",
  city: "Patiala",
  foundedYear: 1956,
  emailDomain: "thapar.edu",
};

// Names under which the institute appears on LinkedIn education entries.
const INSTITUTION_PATTERN = /\bthapar\b|\btiet\b/i;
// Different institutions that share the "Thapar" name.
const INSTITUTION_EXCLUDE_PATTERN = /polytechnic/i;

export const isInstitutionName = (text = "") =>
  INSTITUTION_PATTERN.test(text) && !INSTITUTION_EXCLUDE_PATTERN.test(text);

/**
 * Canonical department names (these are the values stored in User.branch).
 * Order matters: more specific patterns first (e.g. ECE before Electrical).
 * Acronym patterns are case-sensitive on purpose ("IT" must not match "with" or "Institute").
 */
export const DEPARTMENTS = [
  {
    name: "Electronics & Communication Engineering",
    patterns: [/electronics?\s*(and|&)\s*communication/i, /\bECE\b/, /\bENC\b/],
  },
  {
    name: "Electronics & Instrumentation Engineering",
    patterns: [/instrumentation/i, /\bEIC\b/],
  },
  {
    name: "Electrical Engineering",
    patterns: [/electrical/i, /\bEEE?\b/],
  },
  {
    name: "Computer Engineering",
    patterns: [
      /computer/i,
      /software engineering/i,
      /information technology/i,
      /data science/i,
      /artificial intelligence/i,
      /\b(CSE|COE|CS|IT)\b/,
    ],
  },
  { name: "Mechanical Engineering", patterns: [/mechanical/i, /mechatronics/i, /automobile/i, /production/i] },
  { name: "Civil Engineering", patterns: [/civil/i] },
  { name: "Chemical Engineering", patterns: [/chemical engineering/i] },
  { name: "Biotechnology", patterns: [/biotech/i, /biomedical/i] },
  { name: "Mathematics", patterns: [/mathematic/i] },
  { name: "Physics", patterns: [/\bphysics\b/i] },
  { name: "Chemistry", patterns: [/\bchemistry\b/i] },
  { name: "Management", patterns: [/management/i, /business administration/i, /\bMBA\b/] },
];

export const matchDepartment = (text = "") => {
  if (!text) return null;
  for (const dept of DEPARTMENTS) {
    if (dept.patterns.some((p) => p.test(text))) return dept.name;
  }
  return null;
};

/** Degrees awarded by the institute, with their normal duration in years. */
export const DEGREES = [
  { code: "BE", level: "bachelor", years: 4, patterns: [/bachelor of engineering/i, /\bB\.?\s?E\.?(?=$|[\s,)\-])/] },
  { code: "BTech", level: "bachelor", years: 4, patterns: [/bachelor of technology/i, /\bB\.?\s?Tech\b/i] },
  { code: "BSc", level: "bachelor", years: 3, patterns: [/bachelor of science/i, /\bB\.?\s?Sc\b/i] },
  { code: "BBA", level: "bachelor", years: 3, patterns: [/bachelor of business/i, /\bBBA\b/] },
  { code: "ME", level: "master", years: 2, patterns: [/master of engineering/i, /\bM\.?\s?E\.?(?=$|[\s,)\-])/] },
  { code: "MTech", level: "master", years: 2, patterns: [/master of technology/i, /\bM\.?\s?Tech\b/i] },
  { code: "MSc", level: "master", years: 2, patterns: [/master of science/i, /\bM\.?\s?Sc\b/i] },
  { code: "MCA", level: "master", years: 2, patterns: [/master of computer applications/i, /\bMCA\b/] },
  { code: "MBA", level: "master", years: 2, patterns: [/master of business administration/i, /\bMBA\b/] },
  { code: "PhD", level: "doctorate", years: 5, patterns: [/doctor of philosophy/i, /\bPh\.?\s?D\b/i] },
];

export const matchDegree = (text = "") => {
  if (!text) return null;
  return DEGREES.find((d) => d.patterns.some((p) => p.test(text))) || null;
};
