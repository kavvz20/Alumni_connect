import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true, trim: true },
  description: String,
  eventDate: { type: Date, required: true },
  mode: { type: String, enum: ["online", "offline"], default: "online" },
  link: String,
  createdAt: { type: Date, default: Date.now },
});

export const Event = mongoose.model("Event", eventSchema);
