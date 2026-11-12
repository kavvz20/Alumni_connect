import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { app } from "../src/app.js";

describe("Express API Integration Tests", () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe("GET / (Root API info)", () => {
    it("returns 200 with status ok and API information", async () => {
      const res = await fetch(`${baseUrl}/`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "ok");
      assert.ok(data.message.includes("Alumni Connect"));
    });
  });

  describe("GET /api/v1/health (Health check)", () => {
    it("returns 200 with ok status and timestamp", async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "ok");
      assert.ok(data.timestamp);
    });
  });

  describe("URL Normalization Middleware", () => {
    it("handles double slashes seamlessly", async () => {
      const res = await fetch(`${baseUrl}//api//v1//health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "ok");
    });
  });

  describe("404 Error Handling", () => {
    it("returns JSON formatted 404 for non-existent routes", async () => {
      const res = await fetch(`${baseUrl}/api/v1/unknown-endpoint-route`);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.statusCode, 404);
      assert.ok(data.message.includes("Endpoint not found"));
    });
  });

  describe("POST /api/v1/alumni/parse-linkedin-pdf", () => {
    it("returns 400 when neither pdfBase64 nor rawText is provided", async () => {
      const res = await fetch(`${baseUrl}/api/v1/alumni/parse-linkedin-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.includes("pdfBase64"));
    });

    it("parses rawText payload directly via API", async () => {
      const sampleText = `Rohan Verma
Software Engineer at Microsoft || Thapar'2023
Experience
Microsoft
Software Engineer
January 2023 - Present
Top Skills
Go, Kubernetes, Python`;

      const res = await fetch(`${baseUrl}/api/v1/alumni/parse-linkedin-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: sampleText }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.data);
      assert.equal(data.data.currentCompany, "Microsoft");
      assert.equal(data.data.batch, 2023);
    });
  });
});
