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

  it("reads the Education section of the sample", () => {
    const result = parseLinkedInPdfText(samplePdfText);
    assert.equal(result.education.length, 1);
    assert.equal(result.education[0].institution, "Thapar Institute of Engineering & Technology");
    assert.equal(result.education[0].degree, "Bachelor of Technology - BTech");
    assert.equal(result.education[0].fieldOfStudy, "");
    assert.equal(result.education[0].startYear, 2020);
    assert.equal(result.education[0].endYear, 2024);
    assert.equal(result.institution, "Thapar Institute of Engineering & Technology");
  });

  it("marks batch as found (from education) but branch only as inferred when field of study is missing", () => {
    const result = parseLinkedInPdfText(samplePdfText);
    assert.ok(result.fieldsFound.includes("batch"));
    assert.ok(!result.fieldsFound.includes("branch"));
    assert.ok(result.fieldsInferred.includes("branch"));
  });

  const multiEntryPdf = `Contact
www.linkedin.com/in/aman-k (LinkedIn)
Aman Kumar
Hardware Engineer at Intel
Bengaluru, Karnataka, India
Experience
Intel Corporation
Hardware Engineer
June 2021 - Present (5 years)
Education
Thapar Institute of Engineering &
Technology
Bachelor of Engineering - BE, Electronics and Communication
Engineering · (2017 - 2021)
Page 1 of 2
Delhi Public School, R.K. Puram
High School, Science · (2005 - 2017)
`;

  it("handles wrapped institution names, wrapped details and page breaks", () => {
    const result = parseLinkedInPdfText(multiEntryPdf);
    assert.equal(result.education.length, 2);
    assert.equal(result.education[0].institution, "Thapar Institute of Engineering & Technology");
    assert.equal(result.education[0].fieldOfStudy, "Electronics and Communication Engineering");
    assert.equal(result.education[0].endYear, 2021);
    assert.equal(result.education[1].institution, "Delhi Public School, R.K. Puram");
    assert.equal(result.education[1].endYear, 2017);
  });

  it("takes branch and batch from the institute entry, not the school entry", () => {
    const result = parseLinkedInPdfText(multiEntryPdf);
    assert.equal(result.branch, "Electronics & Communication Engineering");
    assert.equal(result.batch, 2021);
    assert.ok(result.fieldsFound.includes("branch"));
    assert.ok(result.fieldsFound.includes("degree"));
  });

  it("no longer tags every profile as Computer Engineering because of 'it' inside words", () => {
    const result = parseLinkedInPdfText(`Experience
Tata Steel
Process Engineer
July 2019 - Present (7 years)
Education
Thapar Institute of Engineering and Technology
Bachelor of Engineering - BE, Chemical Engineering · (2015 - 2019)
`);
    assert.equal(result.branch, "Chemical Engineering");
  });

  it("does not treat Thapar Polytechnic as the institute", () => {
    const result = parseLinkedInPdfText(`Education
Thapar Polytechnic College
Diploma, Mechanical · (2012 - 2015)
`);
    assert.equal(result.institution, "");
    assert.ok(!result.fieldsFound.includes("institution"));
    assert.ok(!result.fieldsFound.includes("batch"));
  });

  it("reports placeholder defaults as neither found nor inferred", () => {
    const result = parseLinkedInPdfText("Some text without any sections at all");
    assert.equal(result.currentCompany, "Leading Firm"); // pre-fill default (unchanged behaviour)
    assert.ok(!result.fieldsFound.includes("currentCompany"));
    assert.ok(!result.fieldsInferred.includes("currentCompany"));
    assert.deepEqual(result.education, []);
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

