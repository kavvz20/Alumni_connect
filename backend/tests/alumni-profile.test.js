import { describe, it } from "node:test";
// Always test the rule-based score, even if a trained model file exists locally.
process.env.ML_MODEL_PATH = "__no_model_in_tests__.json";
import assert from "node:assert/strict";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { User } = await import("../src/models/user.model.js");
const evidence = await import("../src/services/evidence.service.js");
const { sanitizeEducation, normalizeLinkedinUrl, applyEvidenceToken } = await import(
  "../src/services/alumni-profile.service.js"
);
const { parseLinkedInPdfText } = await import("../src/services/linkedin-pdf-parser.service.js");

const alumni = (extra = {}) =>
  new User({ role: "alumni", name: "Neha Gupta", email: "neha@gmail.com", ...extra });

describe("User model: alumni verification fields", () => {
  it("new alumni start as pending and cannot set isVerified themselves", async () => {
    const u = alumni({ isVerified: true });
    await u.validate();
    assert.equal(u.verification.status, "pending");
    assert.equal(u.isVerified, false);
  });

  it("isVerified mirrors verification.status", async () => {
    const u = alumni({ verification: { status: "verified" } });
    await u.validate();
    assert.equal(u.isVerified, true);

    u.verification.status = "needs_manual_review";
    await u.validate();
    assert.equal(u.isVerified, false);
  });

  it("students never carry a verified flag or verification block", async () => {
    const s = new User({ role: "student", name: "S", email: "s@thapar.edu", isVerified: true });
    await s.validate();
    assert.equal(s.isVerified, false);
    assert.equal(s.verification, undefined);
  });

  it("normalises LinkedIn URLs to one canonical lowercase form", async () => {
    const u = alumni({ linkedinUrl: "in.linkedin.com/in/Neha-Gupta-12/?utm=x" });
    await u.validate();
    assert.equal(u.linkedinUrl, "https://www.linkedin.com/in/neha-gupta-12");
    assert.equal(normalizeLinkedinUrl("HTTPS://WWW.LINKEDIN.COM/in/Neha-Gupta-12"), u.linkedinUrl);
  });

  it("rejects values that are not LinkedIn profile URLs", async () => {
    const u = alumni({ linkedinUrl: "https://example.com/neha" });
    await assert.rejects(u.validate(), /valid LinkedIn profile URL/);
  });

  it("computes profileCompleted on the server", async () => {
    const u = alumni({ profileCompleted: true });
    await u.validate();
    assert.equal(u.profileCompleted, false);

    u.linkedinUrl = "https://linkedin.com/in/neha";
    u.batch = 2021;
    u.branch = "Computer Engineering";
    await u.validate();
    assert.equal(u.profileCompleted, true);
  });
});

describe("LinkedIn evidence tokens", () => {
  const extracted = parseLinkedInPdfText(`Experience
Intel Corporation
Hardware Engineer
June 2021 - Present (5 years)
Education
Thapar Institute of Engineering & Technology
Bachelor of Engineering - BE, Computer Engineering · (2017 - 2021)
`);

  it("round-trips the server's parse result", () => {
    const token = evidence.signEvidenceToken({ source: "linkedin_pdf", extracted, fileHash: "abc", issuedTo: null });
    const payload = evidence.verifyEvidenceToken(token, null);
    assert.equal(payload.extracted.batch, 2021);
    assert.equal(payload.fileHash, "abc");
  });

  it("rejects tampered tokens", () => {
    const token = evidence.signEvidenceToken({ source: "linkedin_pdf", extracted, issuedTo: null });
    const [h, p, sig] = token.split(".");
    const forged = JSON.parse(Buffer.from(p, "base64url").toString());
    forged.extracted.batch = 1999;
    const forgedToken = [h, Buffer.from(JSON.stringify(forged)).toString("base64url"), sig].join(".");
    assert.throws(() => evidence.verifyEvidenceToken(forgedToken, null), /expired or is invalid/);
  });

  it("a token issued to one user cannot be used by another", () => {
    const token = evidence.signEvidenceToken({ source: "linkedin_pdf", extracted, issuedTo: "64b000000000000000000001" });
    assert.throws(() => evidence.verifyEvidenceToken(token, "64b000000000000000000002"), /different session/);
    assert.ok(evidence.verifyEvidenceToken(token, "64b000000000000000000001"));
  });

  it("stores evidence on the alumni record, separating provenance lists", async () => {
    const token = evidence.signEvidenceToken({ source: "linkedin_pdf", extracted, issuedTo: null });
    const u = alumni();
    applyEvidenceToken(u, token, null);
    await u.validate();
    assert.equal(u.verification.evidence.source, "linkedin_pdf");
    assert.equal(u.verification.evidence.extracted.education[0].endYear, 2021);
    assert.ok(u.verification.evidence.fieldsFound.includes("batch"));
    assert.equal(u.verification.evidence.extracted.fieldsFound, undefined);
  });

  it("profile pre-fill from evidence skips placeholder defaults", () => {
    const record = evidence.buildEvidenceRecord({
      source: "linkedin_pdf",
      extracted: parseLinkedInPdfText("Education\nThapar Institute of Engineering & Technology\nBE, Civil · (2010 - 2014)"),
    });
    const fields = evidence.profileFieldsFromEvidence(record);
    assert.equal(fields.batch, 2014);
    assert.equal(fields.branch, "Civil Engineering");
    assert.equal(fields.currentCompany, undefined); // parser default "Leading Firm" is not copied
  });
});

describe("sanitizeEducation", () => {
  it("trims rows, drops empty ones and invalid years", () => {
    const rows = sanitizeEducation([
      { institution: "  Thapar Institute  ", degree: "BE", startYear: "2017", endYear: "20211" },
      { institution: "", degree: "" },
      "garbage",
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].institution, "Thapar Institute");
    assert.equal(rows[0].startYear, 2017);
    assert.equal(rows[0].endYear, undefined);
  });
});
