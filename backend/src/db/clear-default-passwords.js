/**
 * Finds accounts that still use the old shared default password ("Thapar@2026") that admin-created
 * accounts used to get, and (with --apply) removes it. Those people then sign in with Google using
 * their email, which proves it is theirs, and can set their own password from their Profile.
 *
 *   cd backend && npm run clear-default-passwords            # report only, changes nothing
 *   cd backend && npm run clear-default-passwords -- --apply  # remove the shared password
 */
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "./index.js";
import { User } from "../models/index.js";

const OLD_DEFAULT_PASSWORD = "Thapar@2026";
const apply = process.argv.includes("--apply");

const run = async () => {
  await connectDB();

  const withPassword = await User.find({ password: { $exists: true, $ne: null } }).select("name email role password");
  const affected = [];
  for (const user of withPassword) {
    if (await bcrypt.compare(OLD_DEFAULT_PASSWORD, user.password)) affected.push(user);
  }

  console.log(`Accounts with a password: ${withPassword.length}`);
  console.log(`Still using the shared default password: ${affected.length}`);
  for (const u of affected) console.log(`  - ${u.role.padEnd(7)} ${u.email}`);

  if (!affected.length) {
    console.log("Nothing to do.");
  } else if (apply) {
    const result = await User.updateMany({ _id: { $in: affected.map((u) => u._id) } }, { $unset: { password: 1 } });
    console.log(`Removed the shared password from ${result.modifiedCount} account(s). They now sign in with Google.`);
  } else {
    console.log("Report only. Run again with --apply to remove the shared password from these accounts.");
  }

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
