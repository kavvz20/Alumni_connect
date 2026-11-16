import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { buildPredictor, loadModel } = await import("../src/services/ml-model.service.js");
const { FEATURE_VERSION, scoreAlumnus } = await import("../src/services/verification.service.js");
const { User } = await import("../src/models/user.model.js");

// Tiny hand-written model files (format tests only, not trained models)
const base = (overrides = {}) => ({
  format: "alumni-verification-model",
  formatVersion: 1,
  version: "vtest-lr",
  algorithm: "logistic_regression",
  featureVersion: FEATURE_VERSION,
  meetsMinimumData: true,
  preprocessing: { features: ["has_evidence", "name_similarity_evidence"], medians: { has_evidence: 0, name_similarity_evidence: 0.5 }, missingIndicators: ["name_similarity_evidence"] },
  model: {
    type: "logistic_regression",
    inputs: ["has_evidence", "name_similarity_evidence", "name_similarity_evidence__missing"],
    mean: [0, 0, 0],
    scale: [1, 1, 1],
    coef: [2, 1, -1],
    intercept: -1,
  },
  calibration: { method: "platt", a: 1, b: 0 },
  ...overrides,
});

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ml-model-test-"));
const writeModel = (name, obj) => {
  const p = path.join(tmp, name);
  fs.writeFileSync(p, JSON.stringify(obj));
  return p;
};

after(() => {
  process.env.ML_MODEL_PATH = path.join(tmp, "none.json");
  loadModel(FEATURE_VERSION);
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("buildPredictor", () => {
  it("logistic regression: imputes missing values and adds the missing indicator", () => {
    const p = buildPredictor(base());
    // z = -1 + 2*1 + 1*0.9 = 1.9
    assert.equal(p.predict({ has_evidence: 1, name_similarity_evidence: 0.9 }), Math.round((1 / (1 + Math.exp(-1.9))) * 10000) / 10000);
    // missing similarity -> median 0.5 and indicator 1: z = -1 + 2 + 0.5 - 1 = 0.5
    assert.equal(p.predict({ has_evidence: 1, name_similarity_evidence: null }), Math.round((1 / (1 + Math.exp(-0.5))) * 10000) / 10000);
  });

  it("random forest: averages leaf probabilities", () => {
    const tree = (thr, pl, pr) => ({ left: [1, -1, -1], right: [2, -1, -1], feature: [1, -2, -2], threshold: [thr, -2, -2], p: [0.5, pl, pr] });
    const p = buildPredictor(
      base({
        algorithm: "random_forest",
        model: { type: "random_forest", inputs: base().model.inputs, trees: [tree(0.7, 0.2, 0.9), tree(0.4, 0.1, 0.6)] },
      })
    );
    assert.equal(p.predict({ has_evidence: 1, name_similarity_evidence: 0.8 }), 0.75); // (0.9 + 0.6) / 2
    assert.equal(p.predict({ has_evidence: 1, name_similarity_evidence: 0.3 }), 0.15); // (0.2 + 0.1) / 2
  });

  it("rejects inconsistent files", () => {
    assert.throws(() => buildPredictor({ ...base(), format: "something-else" }));
    assert.throws(() => buildPredictor(base({ model: { ...base().model, inputs: ["has_evidence"] } })));
  });
});

describe("loadModel safety rules", () => {
  it("falls back to rule-based scoring when no model exists", () => {
    process.env.ML_MODEL_PATH = path.join(tmp, "missing.json");
    const status = loadModel(FEATURE_VERSION);
    assert.equal(status.active, false);
    assert.match(status.reason, /No trained model/);
  });

  it("ignores a model trained on a different feature version", () => {
    process.env.ML_MODEL_PATH = writeModel("old.json", base({ featureVersion: FEATURE_VERSION + 1 }));
    assert.equal(loadModel(FEATURE_VERSION).active, false);
  });

  it("ignores experimental (too little data) models unless explicitly allowed", () => {
    process.env.ML_MODEL_PATH = writeModel("small.json", base({ meetsMinimumData: false }));
    assert.equal(loadModel(FEATURE_VERSION).active, false);
    process.env.ML_ALLOW_SMALL_MODEL = "true";
    assert.equal(loadModel(FEATURE_VERSION).active, true);
    delete process.env.ML_ALLOW_SMALL_MODEL;
  });

  it("uses an active model for the score, keeps the rule score, and still never auto-verifies", async () => {
    process.env.ML_MODEL_PATH = writeModel("good.json", base());
    assert.equal(loadModel(FEATURE_VERSION).active, true);

    const u = new User({ role: "alumni", name: "Neha Gupta", email: "neha@gmail.com" });
    await u.validate(); // scoring runs in the model hook
    assert.equal(u.verification.score.method, "ml");
    assert.equal(u.verification.score.version, "vtest-lr");
    assert.equal(typeof u.verification.score.ruleValue, "number");
    assert.equal(u.verification.status, "pending");

    const again = scoreAlumnus(u, { model: null });
    assert.equal(again.method, "rule_based");
  });
});
