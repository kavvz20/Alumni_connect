import mongoose from "mongoose";
import { sanitizeLinkedInUrl } from "../services/linkedin-scraper.service.js";
import { scoreAlumnus } from "../services/verification.service.js";

export const VERIFICATION_STATUSES = ["pending", "verified", "rejected", "needs_manual_review"];

const educationSchema = new mongoose.Schema(
  {
    institution: { type: String, trim: true },
    degree: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startYear: Number,
    endYear: Number,
  },
  { _id: false }
);

const verificationSchema = new mongoose.Schema(
  {
    status: { type: String, enum: VERIFICATION_STATUSES, default: "pending" },

    // What the server itself extracted from the alumnus's LinkedIn PDF (never client-supplied).
    evidence: {
      source: { type: String, enum: ["linkedin_pdf"] },
      extracted: mongoose.Schema.Types.Mixed,
      fieldsFound: [String],
      fieldsInferred: [String],
      fileHash: String,
      extractedAt: Date,
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    // Facts entered by the admin from institutional records (manual form / CSV).
    adminRecord: {
      batch: Number,
      branch: String,
      degree: String,
    },

    // Automatic warnings for the admin, e.g. a LinkedIn URL already used by another account.
    flags: [
      {
        _id: false,
        type: { type: String },
        detail: String,
        relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Confidence score + match/mismatch checks, and the feature vector it was computed from.
    score: mongoose.Schema.Types.Mixed,
    features: mongoose.Schema.Types.Mixed,
    // Last admin decision
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    note: String,
  },
  { _id: false }
);

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
  // Firebase UID of the linked Google account. Empty until the user signs in with Google.
  firebaseUid: {
    type: String,
    sparse: true,
    unique: true,
  },
  password: { type: String },

  branch: { type: String, trim: true },
  batch: Number,
  skills: { type: [String], default: [] },
  linkedinUrl: String,
  githubUrl: String,
  profilePicture: { type: String, default: "" },
  // LinkedIn account connected through "Sign In with LinkedIn" (official API, used for the profile photo)
  linkedinAccount: {
    sub: { type: String },
    name: { type: String },
    email: { type: String },
    emailVerified: { type: Boolean },
    connectedAt: { type: Date },
  },
  bio: String,

  currentCompany: String,
  currentRole: String,
  industry: String,
  areasOfExpertise: { type: [String], default: [] },
  experience: [
    {
      company: String,
      role: String,
      dates: String,
      description: String,
    },
  ],
  availableForMentorshipCalls: { type: Boolean, default: false },
  willingToRefer: { type: Boolean, default: false },
  // Kept for existing screens and queries; always mirrors verification.status === "verified".
  isVerified: { type: Boolean, default: false },

  careerGoal: String,
  resumeUrl: String,

  // ---- Alumni profile & verification (one model for admin-created and self-registered alumni) ----
  profileSource: { type: String, enum: ["admin_manual", "admin_csv", "self_registered"] },
  // Computed by the server (see pre-validate hook); never accepted from clients.
  profileCompleted: { type: Boolean, default: false },
  education: { type: [educationSchema], default: [] },
  verification: { type: verificationSchema, default: undefined },

  createdAt: { type: Date, default: Date.now },
});

userSchema.pre("validate", function () {
  // Normalise LinkedIn URLs so the same profile always produces the same value (duplicate detection).
  if (this.isModified("linkedinUrl")) {
    const raw = (this.linkedinUrl || "").trim();
    if (!raw) {
      this.linkedinUrl = undefined;
    } else {
      const clean = sanitizeLinkedInUrl(raw);
      if (!clean) {
        this.invalidate("linkedinUrl", "Please enter a valid LinkedIn profile URL (https://www.linkedin.com/in/username).");
      } else {
        this.linkedinUrl = clean.toLowerCase();
      }
    }
  }

  if (this.role === "alumni") {
    if (!this.verification) {
      // Existing records keep their old badge; new records always start pending.
      this.verification = { status: !this.isNew && this.isVerified ? "verified" : "pending" };
    }
    this.isVerified = this.verification.status === "verified";
    this.profileCompleted = Boolean(this.name && this.linkedinUrl && this.batch && this.branch);
    // Keep the evidence score and checks current on every save (pure computation, no DB access).
    scoreAlumnus(this);
  } else {
    this.isVerified = false;
  }
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
userSchema.index({ linkedinUrl: 1 }, { sparse: true });
userSchema.index({ "linkedinAccount.sub": 1 }, { sparse: true });
userSchema.index({ role: 1, "verification.status": 1 });

export const User = mongoose.model("User", userSchema);
