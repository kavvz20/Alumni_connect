import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Runs the verification model exported by ml/train.py (plain JSON, no Python needed at runtime).
 *
 * The model is used only if:
 *   - the file exists and is valid,
 *   - its featureVersion equals the backend's FEATURE_VERSION,
 *   - it was trained on the minimum amount of real labelled data
 *     (or ML_ALLOW_SMALL_MODEL=true is set for experiments).
 * Otherwise scoring falls back to the rule-based evidence score, and the reason is reported.
 */

const DEFAULT_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../ml-models/verification-model.json");

const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const logit = (p) => {
  const q = Math.min(Math.max(p, 1e-6), 1 - 1e-6);
  return Math.log(q / (1 - q));
};

/** Builds a predictor from the exported JSON. Throws if the file is inconsistent. */
export const buildPredictor = (m) => {
  if (m?.format !== "alumni-verification-model" || m.formatVersion !== 1) throw new Error("Unknown model file format.");
  const pre = m.preprocessing;
  const inputs = [...pre.features, ...pre.missingIndicators.map((n) => `${n}__missing`)];
  if (JSON.stringify(inputs) !== JSON.stringify(m.model.inputs)) throw new Error("Model inputs do not match its preprocessing.");

  const toVector = (values = {}) => {
    const raw = pre.features.map((n) => (values[n] === null || values[n] === undefined ? null : Number(values[n])));
    const filled = raw.map((v, i) => (v === null || Number.isNaN(v) ? pre.medians[pre.features[i]] : v));
    const indicators = pre.missingIndicators.map((n) => {
      const v = raw[pre.features.indexOf(n)];
      return v === null || Number.isNaN(v) ? 1 : 0;
    });
    return [...filled, ...indicators];
  };

  let rawProbability;
  if (m.model.type === "random_forest") {
    const trees = m.model.trees;
    rawProbability = (x) => {
      // scikit-learn compares float32 inputs against the split thresholds
      const xf = x.map((v) => Math.fround(v));
      let sum = 0;
      for (const t of trees) {
        let node = 0;
        while (t.left[node] !== -1) node = xf[t.feature[node]] <= t.threshold[node] ? t.left[node] : t.right[node];
        sum += t.p[node];
      }
      return sum / trees.length;
    };
  } else if (m.model.type === "logistic_regression") {
    const { mean, scale, coef, intercept } = m.model;
    rawProbability = (x) => sigmoid(x.reduce((z, v, i) => z + coef[i] * ((v - mean[i]) / scale[i]), intercept));
  } else {
    throw new Error(`Unsupported model type ${m.model.type}.`);
  }

  const { a, b } = m.calibration || { a: 1, b: 0 };
  return {
    version: m.version,
    algorithm: m.algorithm,
    featureVersion: m.featureVersion,
    predict: (values) => Math.round(sigmoid(a * logit(rawProbability(toVector(values))) + b) * 10000) / 10000,
  };
};

const summarize = (m) => ({
  version: m.version,
  algorithm: m.algorithm,
  trainedAt: m.trainedAt,
  meetsMinimumData: m.meetsMinimumData,
  trainingCounts: m.trainingCounts,
  crossValidation: m.evaluation?.crossValidation?.[m.algorithm],
  baselines: m.evaluation?.baselines,
});

let cache = { loaded: false, predictor: null, status: null };

/** Loads (or reloads) the model file. `featureVersion` is the backend's current FEATURE_VERSION. */
export const loadModel = (featureVersion) => {
  const file = process.env.ML_MODEL_PATH ? path.resolve(process.env.ML_MODEL_PATH) : DEFAULT_PATH;
  const allowSmall = process.env.ML_ALLOW_SMALL_MODEL === "true";
  let status;
  let predictor = null;

  if (!fs.existsSync(file)) {
    status = { active: false, reason: "No trained model yet. Scores are rule-based until enough admin decisions exist to train one." };
  } else {
    try {
      const m = JSON.parse(fs.readFileSync(file, "utf8"));
      const info = summarize(m);
      if (m.featureVersion !== featureVersion) {
        status = { active: false, model: info, reason: `Model was trained on feature version ${m.featureVersion}, but the backend uses ${featureVersion}. Retrain it.` };
      } else if (!m.meetsMinimumData && !allowSmall) {
        status = { active: false, model: info, reason: "Model was trained on less than the minimum labelled data (experimental) and is not used." };
      } else {
        predictor = buildPredictor(m);
        status = { active: true, model: info, reason: m.meetsMinimumData ? "ML model active." : "Experimental model active (ML_ALLOW_SMALL_MODEL=true)." };
      }
    } catch (err) {
      status = { active: false, reason: `Model file could not be loaded: ${err.message}` };
    }
  }

  cache = { loaded: true, predictor, status };
  return cache.status;
};

export const getActiveModel = (featureVersion) => {
  if (!cache.loaded) loadModel(featureVersion);
  return cache.predictor;
};

export const getModelStatus = (featureVersion) => {
  if (!cache.loaded) loadModel(featureVersion);
  return cache.status;
};
