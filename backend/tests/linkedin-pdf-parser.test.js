import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseLinkedInPdfText } from "../src/services/linkedin-pdf-parser.service.js";

describe("LinkedIn PDF Parser Service", () => {
  const samplePdfText = `Contact
www.linkedin.com/in/
rachana-9527961ba (LinkedIn)
Top Skills
Computer Science
Leadership
Engineering
Certifications
Virtual Internship
Honors-Awards
HEAD GIRL
Rachana .
SWE @Google || Former Global Information Security Intern
@DisneyStar || Thapar'2024
Patiala, Punjab, India
Experience
Google
Software Engineer
July 2024 - Present (2 years 4 months)
Disney Star
Cybersecurity Intern
January 2024 - July 2024 (7 months)
Thapar ACM Student Chapter
Management Team Member
March 2021 - November 2023 (2 years 9 months)
Education
Thapar Institute of Engineering & Technology
Bachelor of Technology - BTech, none · (2020 - 2024)
Page 1 of 1
`;

  it("extracts full name accurately from headline section", () => {
    const result = parseLinkedInPdfText(samplePdfText);
    assert.equal(result.name, "Rachana");
  });

  it("extracts current company and role with Present indicator", () => {
    const result = parseLinkedInPdfText(samplePdfText);
    assert.equal(result.currentCompany, "Google");
    assert.equal(result.currentRole, "Software Engineer");
  });

  it("extracts graduation batch from Thapar year and date ranges", () => {
    const result = parseLinkedInPdfText(samplePdfText);
    assert.equal(result.batch, 2024);
  });

  it("identifies engineering branch correctly", () => {
    const result = parseLinkedInPdfText(samplePdfText);
    assert.equal(result.branch, "Computer Engineering");
  });

  it("extracts top skills and cleans bullet points", () => {
    const result = parseLinkedInPdfText(samplePdfText);
    assert.ok(Array.isArray(result.skills));
    assert.ok(result.skills.includes("Computer Science"));
    assert.ok(result.skills.includes("Leadership"));
    assert.ok(result.skills.includes("Engineering"));
  });

  it("extracts normalized LinkedIn profile URL", () => {
    const result = parseLinkedInPdfText(samplePdfText);
    assert.equal(result.linkedinUrl, "https://www.linkedin.com/in/rachana-9527961ba");
  });

  it("collects experience history timeline entries", () => {
    const result = parseLinkedInPdfText(samplePdfText);
    assert.ok(Array.isArray(result.experience));
    assert.ok(result.experience.length >= 2);
    assert.equal(result.experience[0].company, "Google");
    assert.equal(result.experience[0].role, "Software Engineer");
  });

  it("infers industry as Technology for software engineers", () => {
    const result = parseLinkedInPdfText(samplePdfText);
    assert.equal(result.industry, "Technology");
  });

  it("handles empty or invalid inputs gracefully without throwing", () => {
    const emptyResult = parseLinkedInPdfText("");
    assert.equal(typeof emptyResult, "object");
    assert.equal(emptyResult.name, "");
    assert.equal(emptyResult.currentCompany, "");

    const nullResult = parseLinkedInPdfText(null);
    assert.equal(typeof nullResult, "object");
    assert.equal(nullResult.name, "");
  });
});

