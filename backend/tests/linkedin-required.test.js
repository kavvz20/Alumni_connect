import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";

process.env.ML_MODEL_PATH = "__no_model_in_tests__.json";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { User } = await import("../src/models/user.model.js");
const { toSafeUser } = await import("../src/services/auth.service.js");
const { hasIncompleteAlumniProfile } = await import("../src/middleware/auth.middleware.js");
const { completeAlumniFilter } = await import("../src/services/profile-requirements.service.js");

const configure = () => {
  process.env.LINKEDIN_CLIENT_ID = "id";
  process.env.LINKEDIN_CLIENT_SECRET = "secret";
  process.env.LINKEDIN_REDIRECT_URI = "https://api.example.app/api/v1/linkedin/callback";
};
const unconfigure = () => {
  delete process.env.LINKEDIN_CLIENT_ID;
  delete process.env.LINKEDIN_CLIENT_SECRET;
  delete process.env.LINKEDIN_REDIRECT_URI;
};

const alumnus = async (linkedinAccount) => {
  const u = new User({
    role: "alumni",
    name: "Priya Sharma",
    email: "priya@gmail.com",
    linkedinUrl: "https://www.linkedin.com/in/priya-sharma",
    batch: 2020,
    branch: "Computer Engineering",
    ...(linkedinAccount && { linkedinAccount: { sub: "li-1", connectedAt: new Date(), ...linkedinAccount } }),
  });
  await u.validate();
  return u;
};

const nameCheck = (u) => u.verification.score.checks.find((c) => c.key === "linkedin_account_name");

describe("Connect LinkedIn is compulsory for alumni once LinkedIn sign-in is configured", () => {
  afterEach(unconfigure);

  it("is not required while the LinkedIn keys are missing", async () => {
    unconfigure();
    const u = await alumnus();
    assert.equal(hasIncompleteAlumniProfile(u), false);
    assert.equal(toSafeUser(u).profileCompleted, true);
    assert.equal(nameCheck(u), undefined); // no permanently-missing check lowering everyone's score
    assert.deepEqual(completeAlumniFilter(), { profileCompleted: true });
  });

  it("blocks and hides alumni who have not connected LinkedIn", async () => {
    configure();
    const u = await alumnus();
    assert.equal(hasIncompleteAlumniProfile(u), true);
    const safe = toSafeUser(u);
    assert.equal(safe.profileCompleted, false);
    assert.equal(safe.linkedinConnectRequired, true);
    assert.equal(completeAlumniFilter()["linkedinAccount.sub"].$exists, true);
  });

  it("lets connected alumni in", async () => {
    configure();
    const u = await alumnus({ name: "Priya Sharma" });
    assert.equal(hasIncompleteAlumniProfile(u), false);
    assert.equal(toSafeUser(u).profileCompleted, true);
  });
});

describe("LinkedIn account name check", () => {
  afterEach(unconfigure);

  it("matches when the LinkedIn sign-in name is the profile name", async () => {
    const u = await alumnus({ name: "Sharma Priya" });
    assert.equal(nameCheck(u).result, "match");
    assert.equal(u.verification.status, "pending");
  });

  it("a different name is a mismatch and sends the profile to manual review", async () => {
    const u = await alumnus({ name: "Rahul Verma" });
    assert.equal(nameCheck(u).result, "mismatch");
    assert.equal(nameCheck(u).hard, true);
    assert.equal(u.verification.status, "needs_manual_review");
  });

  it("is listed as missing when connecting is required but not done", async () => {
    configure();
    const u = await alumnus();
    assert.equal(nameCheck(u).result, "missing");
  });
});
