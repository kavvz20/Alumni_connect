/**
 * Exports the labelled verification dataset for ML training.
 *
 *   cd backend && npm run ml:export          ->  ../ml/data/verification_labels.json
 *
 * Labels come ONLY from real admin decisions (VerificationDecision): verified = 1, rejected = 0.
 * For each alumnus the most recent labelled decision is used, with the features exactly as they
 * were when that decision was made. No names, emails or LinkedIn URLs are exported.
 */
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import connectDB from "./index.js";
import { VerificationDecision } from "../models/index.js";
import { FEATURE_VERSION } from "../services/verification.service.js";

const OUT = path.resolve(process.argv[2] || "../ml/data/verification_labels.json");

const run = async () => {
  await connectDB();

  const latest = await VerificationDecision.aggregate([
    { $match: { label: { $in: [0, 1] } } },
    { $sort: { decidedAt: -1 } },
    { $group: { _id: "$user", doc: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$doc" } },
  ]);

  const rows = [];
  let skippedVersion = 0;
  for (const d of latest) {
    if (d.featureVersion !== FEATURE_VERSION || !d.features) {
      skippedVersion++;
      continue;
    }
    rows.push({
      id: crypto.createHash("sha256").update(String(d.user)).digest("hex").slice(0, 12), // pseudonymous
      label: d.label,
      features: d.features,
      ruleScoreAtDecision: d.scoreMethod === "rule_based" ? d.scoreAtDecision : null,
      profileSource: d.profileSource || null, // for bias analysis only, not a model input
      decidedAt: d.decidedAt,
    });
  }

  const featureNames = [...new Set(rows.flatMap((r) => Object.keys(r.features)))].sort();
  const payload = {
    exportedAt: new Date().toISOString(),
    featureVersion: FEATURE_VERSION,
    featureNames,
    counts: {
      total: rows.length,
      verified: rows.filter((r) => r.label === 1).length,
      rejected: rows.filter((r) => r.label === 0).length,
      skippedOldFeatureVersion: skippedVersion,
    },
    rows,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(`Exported ${rows.length} labelled alumni (${payload.counts.verified} verified, ${payload.counts.rejected} rejected) to ${OUT}`);
  if (skippedVersion) console.log(`Skipped ${skippedVersion} decisions recorded with an older feature version.`);

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Export failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
