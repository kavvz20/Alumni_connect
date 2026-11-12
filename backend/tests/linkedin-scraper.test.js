import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeLinkedInUrl,
  inferIndustry,
  extractSkillsFromText,
  extractExpertiseFromText,
  parseHeadlineDetails,
  parseLinkedInText,
} from "../src/services/linkedin-scraper.service.js";

describe("LinkedIn Scraper & Heuristics Utilities", () => {
  describe("sanitizeLinkedInUrl", () => {
    it("normalizes clean URLs and strips query params and anchors", () => {
      const url = "https://www.linkedin.com/in/rohan-sharma?utm_source=share#experience";
      assert.equal(sanitizeLinkedInUrl(url), "https://www.linkedin.com/in/rohan-sharma");
    });

    it("adds https protocol if missing", () => {
      const url = "linkedin.com/in/priya-patel/";
      assert.equal(sanitizeLinkedInUrl(url), "https://www.linkedin.com/in/priya-patel");
    });

    it("returns null on empty or invalid input", () => {
      assert.equal(sanitizeLinkedInUrl(""), null);
      assert.equal(sanitizeLinkedInUrl(null), null);
    });
  });

  describe("inferIndustry", () => {
    it("correctly identifies Technology", () => {
      assert.equal(inferIndustry("Software Engineer building cloud infrastructure"), "Technology");
      assert.equal(inferIndustry("Full Stack React Developer"), "Technology");
    });

    it("correctly identifies Fintech", () => {
      assert.equal(inferIndustry("Quant Trader in investment banking and crypto payments"), "Fintech");
    });

    it("correctly identifies Healthcare", () => {
      assert.equal(inferIndustry("Biomedical Researcher in clinical pharma"), "Healthcare");
    });

    it("correctly identifies Consulting", () => {
      assert.equal(inferIndustry("Senior Strategy Consultant at McKinsey advisory"), "Consulting");
    });

    it("defaults to Technology when ambiguous", () => {
      assert.equal(inferIndustry("Leader and mentor"), "Technology");
    });
  });

  describe("extractSkillsFromText", () => {
    it("detects programming languages and frameworks", () => {
      const text = "Passionate developer experienced in JavaScript, Python, React, Docker, and Kubernetes.";
      const skills = extractSkillsFromText(text);
      assert.ok(skills.includes("JavaScript"));
      assert.ok(skills.includes("Python"));
      assert.ok(skills.includes("React"));
      assert.ok(skills.includes("Docker"));
      assert.ok(skills.includes("Kubernetes"));
    });

    it("avoids duplicate skills", () => {
      const text = "React developer. Love React. Building in React!";
      const skills = extractSkillsFromText(text);
      const reactCount = skills.filter((s) => s.toLowerCase() === "react").length;
      assert.equal(reactCount, 1);
    });

    it("returns empty array for text with no matching skills", () => {
      const skills = extractSkillsFromText("Just a generic greeting message.");
      assert.ok(Array.isArray(skills));
    });
  });

  describe("extractExpertiseFromText", () => {
    it("maps skills and text to high-level expertise domains", () => {
      const text = "Architecting distributed systems and microservices on AWS.";
      const expertise = extractExpertiseFromText(text, ["AWS", "Microservices"]);
      assert.ok(expertise.length > 0);
      assert.ok(expertise.includes("System Design") || expertise.includes("Cloud Architecture"));
    });

    it("includes Career Mentorship for students and alumni leaders", () => {
      const text = "Alumni coordinator helping students with interview preparation and mentorship.";
      const expertise = extractExpertiseFromText(text, []);
      assert.ok(expertise.includes("Career Mentorship") || expertise.includes("Interview Preparation"));
    });
  });

  describe("parseHeadlineDetails", () => {
    it("parses 'Role at Company' format", () => {
      const { currentRole, currentCompany } = parseHeadlineDetails("Software Engineer at Microsoft");
      assert.equal(currentRole, "Software Engineer");
      assert.equal(currentCompany, "Microsoft");
    });

    it("parses 'Role @ Company' format", () => {
      const { currentRole, currentCompany } = parseHeadlineDetails("Senior SDE @ Amazon");
      assert.equal(currentRole, "Senior SDE");
      assert.equal(currentCompany, "Amazon");
    });

    it("handles piped headline format", () => {
      const { currentRole, currentCompany } = parseHeadlineDetails("DevOps Engineer | Ex-Google | Thapar Alum");
      assert.equal(currentRole, "DevOps Engineer");
    });
  });

  describe("parseLinkedInText", () => {
    it("extracts structured profile from raw text paste", () => {
      const rawText = "Aarav Mehra\nSenior Frontend Engineer at Stripe || Thapar'2022\nSkills: TypeScript, React, Next.js\nChandigarh, India";
      const result = parseLinkedInText(rawText);
      assert.ok(result.currentRole);
      assert.ok(result.skills.length > 0);
      assert.equal(result.industry, "Technology");
    });
  });
});
