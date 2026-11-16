import { describe, it } from "node:test";
// Always test the rule-based score, even if a trained model file exists locally.
process.env.ML_MODEL_PATH = "__no_model_in_tests__.json";
import assert from "node:assert/strict";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.ALLOWED_STUDENT_DOMAIN = "thapar.edu";

const { User } = await import("../src/models/user.model.js");
const { scoreAlumnus, nameSimilarity, extractFeatures } = await import("../src/services/verification.service.js");
const { parseLinkedInPdfText } = await import("../src/services/linkedin-pdf-parser.service.js");
const { buildEvidenceRecord } = await import("../src/services/evidence.service.js");
const { toSafeUser } = await import("../src/services/auth.service.js");

const NOW = new Date("2026-11-16T00:00:00Z");

const pdf = ({ name = "Aman Kumar", handle = "aman-kumar", institution = "Thapar Institute of Engineering & Technology", degree = "Bachelor of Engineering - BE", field = "Computer Engineering", start = 2017, end = 2021 } = {}) =>
  `Contact
www.linkedin.com/in/${handle} (LinkedIn)
${name}
Software Engineer at Microsoft
Noida, Uttar Pradesh, India
Experience
Microsoft
Software Engineer
July 2021 - Present (5 years)
Education
${institution}
${degree}, ${field} · (${start} - ${end})
`;

const alumnusWith = ({ pdfText, profile = {}, adminRecord } = {}) => {
  const u = new User({
    role: "alumni",
    name: "Aman Kumar",
    email: "aman.kumar@gmail.com",
    linkedinUrl: "https://www.linkedin.com/in/aman-kumar",
    batch: 2021,
    branch: "Computer Engineering",
    ...profile,
  });
  u.verification = { status: "pending", adminRecord };
  if (pdfText) {
    u.verification.evidence = buildEvidenceRecord({ source: "linkedin_pdf", extracted: parseLinkedInPdfText(pdfText) });
  }
  return u;
};

const checkOf = (u, key) => u.verification.score.checks.find((c) => c.key === key);

describe("nameSimilarity", () => {
  it("matches reordered names, initials and single-name profiles", () => {
    assert.equal(nameSimilarity("Aman Kumar", "Kumar Aman"), 1);
    assert.ok(nameSimilarity("A. Kumar", "Aman Kumar") >= 0.7);
    assert.ok(nameSimilarity("Rachana", "Rachana Singh") >= 0.6);
    assert.ok(nameSimilarity("Aman Kumar", "Priya Sharma") < 0.3);
    assert.equal(nameSimilarity("", "Aman"), null);
  });
});

describe("rule-based evidence score", () => {
  it("a consistent profile with LinkedIn evidence scores high and stays pending", () => {
    const u = alumnusWith({ pdfText: pdf() });
    scoreAlumnus(u, { now: NOW });
    assert.equal(u.verification.score.method, "rule_based");
    assert.ok(u.verification.score.value >= 0.8, `score ${u.verification.score.value}`);
    assert.equal(u.verification.status, "pending"); // never auto-verified
    assert.equal(checkOf(u, "institution").result, "match");
    assert.equal(checkOf(u, "duration").result, "match");
    assert.equal(checkOf(u, "name").result, "match");
    assert.equal(checkOf(u, "linkedin_url").result, "match");
  });

  it("without evidence everything is 'missing' and the score is low (not a rejection)", () => {
    const u = alumnusWith();
    scoreAlumnus(u, { now: NOW });
    assert.ok(u.verification.score.value < 0.2);
    assert.equal(u.verification.status, "pending");
    assert.equal(checkOf(u, "evidence").result, "missing");
    assert.equal(checkOf(u, "institution").result, "missing");
  });

  it("LinkedIn education without the institute is a hard mismatch → manual review", () => {
    const u = alumnusWith({ pdfText: pdf({ institution: "Punjab Engineering College" }) });
    scoreAlumnus(u, { now: NOW });
    assert.equal(checkOf(u, "institution").result, "mismatch");
    assert.equal(u.verification.status, "needs_manual_review");
  });

  it("a future graduation year (current student) is a hard mismatch", () => {
    const u = alumnusWith({ pdfText: pdf({ start: 2024, end: 2028 }), profile: { batch: 2028 } });
    scoreAlumnus(u, { now: NOW });
    assert.equal(checkOf(u, "grad_year").result, "mismatch");
    assert.equal(u.verification.status, "needs_manual_review");
  });

  it("the institution record disagreeing with LinkedIn is a hard mismatch", () => {
    const u = alumnusWith({ pdfText: pdf(), adminRecord: { batch: 2018, branch: "Civil Engineering" } });
    scoreAlumnus(u, { now: NOW });
    assert.equal(checkOf(u, "batch_consistent").result, "mismatch");
    assert.equal(checkOf(u, "dept_consistent").result, "mismatch");
    assert.equal(u.verification.status, "needs_manual_review");
  });

  it("a PDF from a different LinkedIn profile is a hard mismatch", () => {
    const u = alumnusWith({ pdfText: pdf({ handle: "someone-else" }) });
    scoreAlumnus(u, { now: NOW });
    assert.equal(checkOf(u, "linkedin_url").result, "mismatch");
    assert.equal(u.verification.status, "needs_manual_review");
  });

  it("editing the profile away from the evidence shows up as a mismatch", () => {
    const u = alumnusWith({ pdfText: pdf(), profile: { batch: 2019 } });
    scoreAlumnus(u, { now: NOW });
    assert.equal(checkOf(u, "batch_consistent").result, "mismatch");
    assert.ok(u.verification.score.value < 0.9);
  });

  it("unusual course duration is a soft mismatch", () => {
    const u = alumnusWith({ pdfText: pdf({ start: 2014, end: 2021 }) });
    scoreAlumnus(u, { now: NOW });
    assert.equal(checkOf(u, "duration").result, "mismatch");
    assert.equal(u.verification.status, "pending");
  });

  it("never changes an admin decision (verified stays verified, rejected stays rejected)", () => {
    for (const status of ["verified", "rejected"]) {
      const u = alumnusWith({ pdfText: pdf({ institution: "Some Other College" }) });
      u.verification.status = status;
      scoreAlumnus(u, { now: NOW });
      assert.equal(u.verification.status, status);
    }
  });

  it("does not automatically move a profile out of manual review", () => {
    const u = alumnusWith({ pdfText: pdf() });
    u.verification.status = "needs_manual_review";
    scoreAlumnus(u, { now: NOW });
    assert.equal(u.verification.status, "needs_manual_review");
  });

  it("is computed automatically whenever an alumni record is validated", async () => {
    const u = alumnusWith({ pdfText: pdf() });
    await u.validate();
    assert.ok(u.verification.score);
    assert.equal(u.verification.features.version, 1);
  });

  it("features use null for missing information instead of guessing", () => {
    const f = extractFeatures(alumnusWith(), NOW).values;
    assert.equal(f.has_evidence, 0);
    assert.equal(f.evidence_institution_match, null);
    assert.equal(f.grad_year_plausible, null);
    assert.equal(f.name_similarity_evidence, null);
  });

  it("an institutional email is positive evidence", () => {
    const u = alumnusWith({ pdfText: pdf(), profile: { email: "aman_be21@thapar.edu" } });
    scoreAlumnus(u, { now: NOW });
    assert.equal(checkOf(u, "email").result, "match");
  });
});

describe("what the alumnus sees about their own verification", () => {
  it("shows score and checks but not institution records, features or other accounts", () => {
    const u = alumnusWith({ pdfText: pdf(), adminRecord: { batch: 2018 } });
    u.verification.flags = [{ type: "possible_duplicate", detail: "Also used by other@x.com" }];
    scoreAlumnus(u, { now: NOW });
    const safe = toSafeUser(u);
    const text = JSON.stringify(safe.verification);
    assert.ok(safe.verification.score.value >= 0);
    assert.equal(safe.verification.adminRecord, undefined);
    assert.equal(safe.verification.features, undefined);
    assert.ok(!text.includes("2018"), "institution record value leaked");
    assert.ok(!text.includes("other@x.com"), "other account leaked");
  });
});
