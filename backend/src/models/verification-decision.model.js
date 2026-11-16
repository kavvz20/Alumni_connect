import mongoose from "mongoose";

/**
 * Append-only log of admin verification decisions.
 *
 * Each entry stores the feature vector AS IT WAS when the admin decided, so the training data does
 * not change if the profile is edited later. "verified" (label 1) and "rejected" (label 0) decisions
 * are the labelled dataset for the ML model; "needs_manual_review" / "pending" (revoked) have no label.
 */
const verificationDecisionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  decision: { type: String, enum: ["verified", "rejected", "needs_manual_review", "pending"], required: true },
  label: { type: Number, enum: [0, 1, null], default: null },
  previousStatus: String,
  note: String,

  // Snapshot used for training
  featureVersion: Number,
  features: mongoose.Schema.Types.Mixed,
  scoreAtDecision: Number,
  scoreMethod: String,
  scoreVersion: String,

  // Kept for analysis only (e.g. checking for bias); NOT used as a model input.
  profileSource: String,
  evidenceSource: String,

  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  decidedAt: { type: Date, default: Date.now },
});

verificationDecisionSchema.index({ label: 1, decidedAt: -1 });

export const VerificationDecision = mongoose.model("VerificationDecision", verificationDecisionSchema);
