import mongoose from "mongoose";

const referralRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  alumniId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity" },
  companyName: { type: String, required: true, trim: true },
  jobId: { type: String, required: true, trim: true },
  jobLink: { type: String, required: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  resumeUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

referralRequestSchema.index({ alumniId: 1, status: 1 });
referralRequestSchema.index({ studentId: 1, status: 1 });
referralRequestSchema.index(
  { studentId: 1, alumniId: 1, companyName: 1, jobId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "approved"] } },
  }
);

export const ReferralRequest = mongoose.model(
  "ReferralRequest",
  referralRequestSchema
);
