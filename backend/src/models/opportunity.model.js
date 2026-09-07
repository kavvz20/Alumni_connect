import mongoose from "mongoose";

const opportunitySchema = new mongoose.Schema({
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["internship", "job", "hackathon", "referral", "workshop"],
    required: true,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  applyLink: String,
  company: String,
  createdAt: { type: Date, default: Date.now },
});

export const Opportunity = mongoose.model("Opportunity", opportunitySchema);
