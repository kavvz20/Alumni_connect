/**
 * Creates (or updates) the admin account for ADMIN_EMAIL with a password, so the admin can use
 * email + password login without Google/Firebase.
 *
 *   cd backend
 *   npm run create-admin -- "YourStrongPassword"
 */
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "./index.js";
import { User } from "../models/index.js";

const run = async () => {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.argv[2] || "";

  if (!email) {
    console.error("Set ADMIN_EMAIL in backend/.env first.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Usage: npm run create-admin -- "YourStrongPassword"   (at least 8 characters)');
    process.exit(1);
  }

  await connectDB();
  const hashed = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = "admin";
    existing.password = hashed;
    await existing.save();
    console.log(`Updated ${email}: role=admin, password set.`);
  } else {
    await User.create({ role: "admin", name: "Administrator", email, password: hashed });
    console.log(`Created admin account ${email}.`);
  }
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Could not create the admin account:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
