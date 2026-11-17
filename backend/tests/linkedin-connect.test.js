import { describe, it, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

process.env.ML_MODEL_PATH = "__no_model_in_tests__.json";
process.env.JWT_SECRET = "test-secret";
process.env.FRONTEND_URL = "https://alumni.example.app/";

const oidc = await import("../src/services/linkedin-oidc.service.js");
const { app } = await import("../src/app.js");

const configure = () => {
  process.env.LINKEDIN_CLIENT_ID = "client-id";
  process.env.LINKEDIN_CLIENT_SECRET = "client-secret";
  process.env.LINKEDIN_REDIRECT_URI = "https://api.example.app/api/v1/linkedin/callback";
};
const unconfigure = () => {
  delete process.env.LINKEDIN_CLIENT_ID;
  delete process.env.LINKEDIN_CLIENT_SECRET;
  delete process.env.LINKEDIN_REDIRECT_URI;
};

const response = (status, body, type = "application/json") => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (h) => (h.toLowerCase() === "content-type" ? type : null) },
  json: async () => body,
  arrayBuffer: async () => (body instanceof Uint8Array ? body.buffer : new ArrayBuffer(0)),
});

describe("LinkedIn connect (OpenID Connect)", () => {
  afterEach(() => {
    oidc.setFetchForTests(null);
    unconfigure();
  });

  it("is hidden until the LinkedIn app keys are configured", () => {
    unconfigure();
    assert.equal(oidc.isLinkedinConnectConfigured(), false);
    assert.throws(() => oidc.buildAuthorizationUrl("64b000000000000000000001"), /not configured/);
    configure();
    assert.equal(oidc.isLinkedinConnectConfigured(), true);
  });

  it("builds an authorization URL with a signed state for this user", () => {
    configure();
    const url = new URL(oidc.buildAuthorizationUrl("64b000000000000000000001"));
    assert.equal(url.origin + url.pathname, "https://www.linkedin.com/oauth/v2/authorization");
    assert.equal(url.searchParams.get("scope"), "openid profile email");
    assert.equal(url.searchParams.get("redirect_uri"), process.env.LINKEDIN_REDIRECT_URI);
    assert.equal(oidc.verifyState(url.searchParams.get("state")), "64b000000000000000000001");
  });

  it("rejects a forged or foreign state", () => {
    assert.throws(() => oidc.verifyState("not-a-token"), /expired/);
  });

  it("reads the OpenID profile", async () => {
    configure();
    oidc.setFetchForTests(async (url) =>
      String(url).includes("accessToken")
        ? response(200, { access_token: "tok" })
        : response(200, { sub: "abc", name: "Priya Sharma", email: "P@X.com", email_verified: true, picture: "https://media.licdn.com/p.jpg" })
    );
    const p = await oidc.fetchLinkedinProfile("code");
    assert.deepEqual(p, { sub: "abc", name: "Priya Sharma", email: "p@x.com", emailVerified: true, picture: "https://media.licdn.com/p.jpg" });
  });

  it("stores the photo itself (LinkedIn links expire) and only accepts images", async () => {
    oidc.setFetchForTests(async () => response(200, new Uint8Array([1, 2, 3]), "image/jpeg"));
    assert.equal(await oidc.downloadPictureAsDataUrl("https://media.licdn.com/p.jpg"), "data:image/jpeg;base64,AQID");

    oidc.setFetchForTests(async () => response(200, new Uint8Array([1]), "text/html"));
    assert.equal(await oidc.downloadPictureAsDataUrl("https://media.licdn.com/p.jpg"), null);
    assert.equal(await oidc.downloadPictureAsDataUrl("http://insecure.example/p.jpg"), null);
  });

  describe("HTTP routes", () => {
    let server;
    let baseUrl;
    before(async () => {
      await new Promise((resolve) => {
        server = http.createServer(app).listen(0, () => {
          baseUrl = `http://127.0.0.1:${server.address().port}`;
          resolve();
        });
      });
    });
    after(async () => server && new Promise((resolve) => server.close(resolve)));

    it("status reports whether the button should be shown", async () => {
      unconfigure();
      const body = await (await fetch(`${baseUrl}/api/v1/linkedin/status`)).json();
      assert.equal(body.data.configured, false);
    });

    it("starting a connection requires a session", async () => {
      assert.equal((await fetch(`${baseUrl}/api/v1/linkedin/connect`)).status, 401);
    });

    it("callback returns to the profile page with the result", async () => {
      const cancelled = await fetch(`${baseUrl}/api/v1/linkedin/callback?error=user_cancelled_login`, { redirect: "manual" });
      assert.equal(cancelled.status, 302);
      assert.equal(cancelled.headers.get("location"), "https://alumni.example.app/profile?linkedin=cancelled");

      const forged = await fetch(`${baseUrl}/api/v1/linkedin/callback?code=x&state=forged`, { redirect: "manual" });
      assert.equal(forged.headers.get("location"), "https://alumni.example.app/profile?linkedin=expired");
    });
  });
});
