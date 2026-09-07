import mongoose from "mongoose";

const mentorshipMeetingRequestSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
    default: "pending",
  },
  agenda: { type: String, required: true, trim: true },
  meetingScheduledAt: Date,
  googleCalendarEventId: String,
  meetingLink: String,
  createdAt: { type: Date, default: Date.now },
});

mentorshipMeetingRequestSchema.index({ studentId: 1, status: 1 });
mentorshipMeetingRequestSchema.index({ alumniId: 1, status: 1 });
mentorshipMeetingRequestSchema.index(
  { studentId: 1, alumniId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "accepted"] } },
  }
);

export const MentorshipMeetingRequest = mongoose.model(
  "MentorshipMeetingRequest",
  mentorshipMeetingRequestSchema
);
