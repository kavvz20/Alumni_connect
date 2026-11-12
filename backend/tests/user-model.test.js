import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { User } from "../src/models/user.model.js";

describe("User Model Schema Validation", () => {
  it("passes validation with valid student data", async () => {
    const user = new User({
      role: "student",
      name: "Tanya Sharma",
      email: "tanya.sharma@thapar.edu",
      branch: "Computer Engineering",
      batch: 2026,
      skills: ["React", "Python"],
      careerGoal: "Seeking Software Engineering internships",
    });

    await user.validate();
    assert.equal(user.role, "student");
    assert.equal(user.email, "tanya.sharma@thapar.edu");
    assert.equal(user.availableForMentorshipCalls, false);
    assert.equal(user.isVerified, false);
  });

  it("passes validation with valid alumni data including experience", async () => {
    const user = new User({
      role: "alumni",
      name: "Rachana",
      email: "rachana@alumni.thapar.edu",
      currentCompany: "Google",
      currentRole: "Software Engineer",
      industry: "Technology",
      branch: "Computer Engineering",
      batch: 2024,
      skills: ["Go", "Distributed Systems", "Kubernetes"],
      areasOfExpertise: ["System Design", "Cloud Architecture"],
      availableForMentorshipCalls: true,
      willingToRefer: true,
      isVerified: true,
      experience: [
        {
          company: "Google",
          role: "Software Engineer",
          dates: "July 2024 - Present",
        },
        {
          company: "Disney Star",
          role: "Cybersecurity Intern",
          dates: "Jan 2024 - July 2024",
        },
      ],
    });

    await user.validate();
    assert.equal(user.role, "alumni");
    assert.equal(user.experience.length, 2);
    assert.equal(user.experience[0].company, "Google");
    assert.equal(user.isVerified, true);
  });

  it("fails validation when required fields are missing", async () => {
    const emptyUser = new User({});
    let error;
    try {
      await emptyUser.validate();
    } catch (err) {
      error = err;
    }
    assert.ok(error);
    assert.ok(error.errors.role, "Role should be required");
    assert.ok(error.errors.name, "Name should be required");
    assert.ok(error.errors.email, "Email should be required");
  });

  it("rejects invalid role values outside enum", async () => {
    const user = new User({
      role: "superhero",
      name: "Clark Kent",
      email: "clark@dailyplanet.com",
    });

    let error;
    try {
      await user.validate();
    } catch (err) {
      error = err;
    }
    assert.ok(error);
    assert.ok(error.errors.role);
    assert.ok(error.errors.role.message.includes("is not a valid enum value"));
  });

  it("auto-generates unique firebaseUid fallback when not specified", () => {
    const user = new User({
      role: "student",
      name: "Aditya Singh",
      email: "aditya@thapar.edu",
    });

    assert.ok(user.firebaseUid);
    assert.ok(user.firebaseUid.startsWith("uid_"));
  });
});
