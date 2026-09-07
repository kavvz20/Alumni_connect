import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ["student", "alumni", "admin"], required: true },
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  firebaseUid: {
    type: String,
    sparse: true,
    unique: true,
    default: () => `uid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  },
  password: { type: String },

  branch: { type: String, trim: true },
  batch: Number,
  skills: { type: [String], default: [] },
  linkedinUrl: String,
  githubUrl: String,
  bio: String,

  currentCompany: String,
  currentRole: String,
  industry: String,
  areasOfExpertise: { type: [String], default: [] },
  availableForMentorshipCalls: { type: Boolean, default: false },
  willingToRefer: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },

  careerGoal: String,
  resumeUrl: String,
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({
  name: "text",
  currentCompany: "text",
  currentRole: "text",
  industry: "text",
  skills: "text",
  areasOfExpertise: "text",
});
userSchema.index({
  role: 1,
  isVerified: 1,
  branch: 1,
  batch: 1,
  industry: 1,
  currentRole: 1,
});

export const User = mongoose.model("User", userSchema);
