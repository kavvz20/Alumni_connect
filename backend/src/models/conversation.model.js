import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participantOneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participantTwoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

conversationSchema.index(
  { participantOneId: 1, participantTwoId: 1 },
  { unique: true }
);

export const Conversation = mongoose.model("Conversation", conversationSchema);
