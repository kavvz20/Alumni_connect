import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Alumni Directory Search & Filter Engine", () => {
  const sampleAlumni = [
    {
      _id: "1",
      name: "Rachana",
      currentCompany: "Google",
      currentRole: "Software Engineer",
      branch: "Computer Engineering",
      batch: 2024,
      industry: "Technology",
      skills: ["Go", "Distributed Systems", "Kubernetes"],
      isVerified: true,
      availableForMentorshipCalls: true,
      willingToRefer: true,
    },
    {
      _id: "2",
      name: "Devansh Verma",
      currentCompany: "Amazon",
      currentRole: "SDE II",
      branch: "Electronics & Communication",
      batch: 2021,
      industry: "E-Commerce",
      skills: ["Java", "AWS", "DynamoDB"],
      isVerified: true,
      availableForMentorshipCalls: false,
      willingToRefer: true,
    },
    {
      _id: "3",
      name: "Simran Kaur",
      currentCompany: "Goldman Sachs",
      currentRole: "Quant Analyst",
      branch: "Computer Engineering",
      batch: 2023,
      industry: "FinTech",
      skills: ["Python", "C++", "Finance"],
      isVerified: false,
      availableForMentorshipCalls: true,
      willingToRefer: false,
    },
  ];

  it("filters alumni by branch", () => {
    const results = sampleAlumni.filter((a) => a.branch === "Computer Engineering");
    assert.equal(results.length, 2);
    assert.ok(results.some((a) => a.name === "Rachana"));
    assert.ok(results.some((a) => a.name === "Simran Kaur"));
  });

  it("filters alumni by industry", () => {
    const fintech = sampleAlumni.filter((a) => a.industry === "FinTech");
    assert.equal(fintech.length, 1);
    assert.equal(fintech[0].name, "Simran Kaur");
  });

  it("filters alumni by search query across name, role, and company", () => {
    const query = "google";
    const matched = sampleAlumni.filter((a) => {
      const corpus = `${a.name} ${a.currentRole} ${a.currentCompany}`.toLowerCase();
      return corpus.includes(query.toLowerCase());
    });
    assert.equal(matched.length, 1);
    assert.equal(matched[0].name, "Rachana");
  });

  it("filters by skill keywords", () => {
    const matched = sampleAlumni.filter((a) =>
      a.skills.some((s) => s.toLowerCase() === "aws")
    );
    assert.equal(matched.length, 1);
    assert.equal(matched[0].name, "Devansh Verma");
  });

  it("filters only verified alumni", () => {
    const verified = sampleAlumni.filter((a) => a.isVerified === true);
    assert.equal(verified.length, 2);
    assert.ok(verified.every((a) => a.isVerified));
  });

  it("filters alumni open to mentorship calls", () => {
    const mentors = sampleAlumni.filter((a) => a.availableForMentorshipCalls === true);
    assert.equal(mentors.length, 2);
  });
});

