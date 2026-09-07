import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: { type: String, required: true, trim: true },
  sentAt: { type: Date, default: Date.now },
});

messageSchema.index({ conversationId: 1, sentAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
