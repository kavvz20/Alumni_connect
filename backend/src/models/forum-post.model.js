import mongoose from "mongoose";

const forumPostSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  question: { type: String, required: true, trim: true },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export const ForumPost = mongoose.model("ForumPost", forumPostSchema);
