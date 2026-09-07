import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetType: {
    type: String,
    enum: ["user", "forumPost", "comment", "opportunity"],
    required: true,
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ["open", "reviewed", "dismissed"],
    default: "open",
  },
  createdAt: { type: Date, default: Date.now },
});

export const Report = mongoose.model("Report", reportSchema);
