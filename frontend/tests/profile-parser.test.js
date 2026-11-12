import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Frontend Profile Data & Utilities", () => {
  it("formats alumni headline from role and company", () => {
    const formatHeadline = (role, company, batch) => {
      if (role && company) {
        return `${role} at ${company}${batch ? ` · Class of '${String(batch).slice(-2)}` : ""}`;
      }
      return "Thapar Alumnus";
    };

    assert.equal(
      formatHeadline("Senior Software Engineer", "Google", 2024),
      "Senior Software Engineer at Google · Class of '24"
    );
    assert.equal(formatHeadline("", ""), "Thapar Alumnus");
  });

  it("normalizes skills string to array and deduplicates", () => {
    const cleanSkills = (skillsInput) => {
      if (Array.isArray(skillsInput)) return Array.from(new Set(skillsInput));
      if (typeof skillsInput === "string") {
        return Array.from(
          new Set(
            skillsInput
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        );
      }
      return [];
    };

    const result = cleanSkills("React, Node.js, Python, React,  Docker ");
    assert.deepEqual(result, ["React", "Node.js", "Python", "Docker"]);
  });

  it("assigns appropriate badge color variant based on user role", () => {
    const getRoleBadgeVariant = (role) => {
      switch (role) {
        case "alumni":
          return "amber";
        case "student":
          return "cyan";
        case "admin":
          return "emerald";
        default:
          return "indigo";
      }
    };

    assert.equal(getRoleBadgeVariant("alumni"), "amber");
    assert.equal(getRoleBadgeVariant("student"), "cyan");
    assert.equal(getRoleBadgeVariant("admin"), "emerald");
    assert.equal(getRoleBadgeVariant("unknown"), "indigo");
  });

  it("generates correct public profile permalinks", () => {
    const getProfileUrl = (origin, userId) => {
      return `${origin.replace(/\/+$/, "")}/profile/${userId}`;
    };

    assert.equal(
      getProfileUrl("https://alumni.thapar.edu", "60d0fe4f5311236168a109ca"),
      "https://alumni.thapar.edu/profile/60d0fe4f5311236168a109ca"
    );
  });
});

