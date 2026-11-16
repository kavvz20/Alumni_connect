/**
 * One-off migration for the auth + alumni profile upgrade. Safe to run more than once.
 *
 *   cd backend && npm run migrate
 *
 * - Removes placeholder Firebase UIDs ("uid_..." / "demo_...") so real Google accounts can link by email.
 * - Gives every alumni a verification status (verified if they already had the badge, otherwise pending).
 * - Normalises LinkedIn URLs and recomputes profileCompleted.
 * - Reports LinkedIn profiles shared by more than one account for the admin to resolve.
 */
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import mongoose from "mongoose";
import connectDB from "./index.js";
import { User } from "../models/index.js";

const run = async () => {
  await connectDB();

  const uidResult = await User.updateMany(
    { firebaseUid: { $regex: /^(uid_|demo_)/ } },
    { $unset: { firebaseUid: 1 } }
  );
  console.log(`Placeholder Firebase UIDs removed: ${uidResult.modifiedCount}`);

  let updated = 0;
  const problems = [];
  const alumni = await User.find({ role: "alumni" });
  for (const doc of alumni) {
    if (doc.linkedinUrl) doc.markModified("linkedinUrl"); // re-run URL normalisation
    try {
      await doc.save(); // pre-validate hook sets verification.status, isVerified, profileCompleted
      updated++;
    } catch (err) {
      problems.push(`${doc.email}: ${Object.values(err.errors || {})[0]?.message || err.message}`);
    }
  }
  console.log(`Alumni profiles migrated: ${updated}/${alumni.length}`);
  if (problems.length) console.log("Could not migrate (fix manually):\n  " + problems.join("\n  "));

  const shared = await User.aggregate([
    { $match: { linkedinUrl: { $type: "string", $ne: "" } } },
    { $group: { _id: "$linkedinUrl", emails: { $push: "$email" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  if (shared.length) {
    console.log("LinkedIn profiles used by more than one account:");
    for (const s of shared) console.log(`  ${s._id}: ${s.emails.join(", ")}`);
  } else {
    console.log("No shared LinkedIn profiles found.");
  }

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Migration failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
