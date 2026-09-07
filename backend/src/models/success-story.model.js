import mongoose from "mongoose";

const successStorySchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true, trim: true },
  story: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: [
      "placement",
      "internship",
      "career-transition",
      "interview-experience",
    ],
  },
  createdAt: { type: Date, default: Date.now },
});

export const SuccessStory = mongoose.model("SuccessStory", successStorySchema);
