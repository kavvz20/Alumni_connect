import { describe, it, before, after } from "node:test";
// Always test the rule-based score, even if a trained model file exists locally.
process.env.ML_MODEL_PATH = "__no_model_in_tests__.json";
import assert from "node:assert/strict";
import http from "node:http";

process.env.ADMIN_EMAIL = "Owner.Admin@gmail.com";
process.env.JWT_SECRET = "test-secret";
delete process.env.FIREBASE_PROJECT_ID;
delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

const { app } = await import("../src/app.js");
const auth = await import("../src/services/auth.service.js");

describe("auth.service rules", () => {
  it("only the configured ADMIN_EMAIL is an admin email (case-insensitive)", () => {
    assert.equal(auth.isAdminEmail("owner.admin@gmail.com"), true);
    assert.equal(auth.isAdminEmail(" OWNER.ADMIN@GMAIL.COM "), true);
    assert.equal(auth.isAdminEmail("someone.else@gmail.com"), false);
  });

  it("admin rights come only from the admin email, on top of the account's own role", () => {
    assert.equal(auth.isAuthorizedAdmin({ role: "admin", email: "owner.admin@gmail.com" }), true);
    assert.equal(auth.isAuthorizedAdmin({ role: "admin", email: "intruder@gmail.com" }), false);
    // the admin's own account can also be a student (or alumni) and keeps that role
    assert.equal(auth.isAuthorizedAdmin({ role: "student", email: "owner.admin@gmail.com" }), true);
    assert.equal(auth.isAuthorizedAdmin({ role: "student", email: "someone@thapar.edu" }), false);
  });

  it("toSafeUser marks the admin account", () => {
    assert.equal(auth.toSafeUser({ role: "student", email: "owner.admin@gmail.com" }).isAdmin, true);
    assert.equal(auth.toSafeUser({ role: "student", email: "x@thapar.edu" }).isAdmin, false);
  });

  it("recognises institutional student emails", () => {
    assert.equal(auth.isInstitutionalEmail("rahul_be22@thapar.edu"), true);
    assert.equal(auth.isInstitutionalEmail("rahul@gmail.com"), false);
    assert.equal(auth.isInstitutionalEmail("rahul@fakethapar.edu"), false);
  });

  it("session tokens round-trip and reject tampering", () => {
    const token = auth.signSessionToken({ _id: "64b000000000000000000001", role: "student" });
    assert.equal(auth.verifySessionToken(token).sub, "64b000000000000000000001");
    assert.throws(() => auth.verifySessionToken(token.slice(0, -2) + "xx"));
  });

  it("toSafeUser strips secrets and exposes hasPassword", () => {
    const safe = auth.toSafeUser({ name: "A", password: "hash", firebaseUid: "g1", __v: 0 });
    assert.equal(safe.password, undefined);
    assert.equal(safe.firebaseUid, undefined);
    assert.equal(safe.hasPassword, true);
  });
});

describe("auth API (no database required)", () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  const post = (path, body, headers = {}) =>
    fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });

  it("protected routes reject requests without a session", async () => {
    const res = await fetch(`${baseUrl}/api/v1/users`);
    assert.equal(res.status, 401);
  });

  it("ignores the old x-user-id header and body actorId", async () => {
    const res = await post(
      "/api/v1/users/onboard",
      { role: "alumni", name: "X", email: "x@gmail.com", adminId: "64b000000000000000000001" },
      { "x-user-id": "64b000000000000000000001" }
    );
    assert.equal(res.status, 401);
  });

  it("verification queue and decisions require a session", async () => {
    assert.equal((await fetch(`${baseUrl}/api/v1/verification`)).status, 401);
    const res = await fetch(`${baseUrl}/api/v1/verification/64b000000000000000000001`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": "64b000000000000000000001" },
      body: JSON.stringify({ decision: "verified" }),
    });
    assert.equal(res.status, 401);
  });

  it("rejects an invalid bearer token", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { Authorization: "Bearer not-a-token" } });
    assert.equal(res.status, 401);
  });

  it("there is no email + password sign-up (accounts come from Google or the admin)", async () => {
    const body = { role: "alumni", name: "Someone", email: "victim@thapar.edu", password: "secret123" };
    assert.equal((await post("/api/v1/auth/register", body)).status, 404);
    // POST /users without a session must not create an account either
    assert.notEqual((await post("/api/v1/users", body)).status, 201);
  });

  it("Google sign-in requires an ID token", async () => {
    const res = await post("/api/v1/auth/google", { requestedRole: "student" });
    assert.equal(res.status, 400);
  });

  it("Google sign-in reports when Firebase is not configured", async () => {
    const res = await post("/api/v1/auth/google", { idToken: "abc", requestedRole: "alumni" });
    assert.equal(res.status, 503);
  });
});

describe("LinkedIn URL fetching", () => {
  it("is disabled by default and asks for the PDF export", async () => {
    delete process.env.LINKEDIN_URL_FETCH;
    const { scrapeLinkedInData } = await import("../src/services/linkedin-scraper.service.js");
    const result = await scrapeLinkedInData("https://www.linkedin.com/in/someone");
    assert.equal(result.success, false);
    assert.equal(result.source, "url_fetch_disabled");
    assert.match(result.message, /PDF/);
  });
});

describe("requireCompleteProfile", async () => {
  const { requireCompleteProfile } = await import("../src/middleware/auth.middleware.js");
  const run = (user) => {
    let status = null;
    let passed = false;
    const res = { status: (s) => ((status = s), { json: () => {} }) };
    requireCompleteProfile({ user }, res, () => (passed = true));
    return { status, passed };
  };

  it("blocks alumni whose profile is incomplete", () => {
    assert.deepEqual(run({ role: "alumni", email: "a@gmail.com", profileCompleted: false }), { status: 403, passed: false });
  });

  it("lets complete alumni, students and the admin email through", () => {
    assert.equal(run({ role: "alumni", email: "a@gmail.com", profileCompleted: true }).passed, true);
    assert.equal(run({ role: "student", email: "s@thapar.edu", profileCompleted: false }).passed, true);
    assert.equal(run({ role: "alumni", email: "owner.admin@gmail.com", profileCompleted: false }).passed, true);
    assert.equal(run(undefined).passed, true);
  });
});
