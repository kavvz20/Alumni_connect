import { PDFParse } from "pdf-parse";
import { inferIndustry, extractSkillsFromText, extractExpertiseFromText } from "./linkedin-scraper.service.js";

/**
 * Parses raw text extracted from an official LinkedIn "Save to PDF" export.
 */
export function parseLinkedInPdfText(rawText = "") {
  if (!rawText || typeof rawText !== "string") {
    return {
      name: "",
      currentRole: "",
      currentCompany: "",
      industry: "Technology",
      branch: "Computer Engineering",
      batch: null,
      skills: [],
      areasOfExpertise: [],
      bio: "",
      linkedinUrl: "",
      experience: [],
    };
  }

  // Normalize newlines and clean lines
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let name = "";
  let currentCompany = "";
  let currentRole = "";
  let linkedinUrl = "";
  let topSkills = [];
  let batch = null;
  let branch = "Computer Engineering";
  let headline = "";
  const experienceList = [];

  // 1. LinkedIn URL Extraction (handles URL split across lines)
  const urlMatch = rawText.match(/linkedin\.com\/in\/\s*([a-zA-Z0-9_\-%]+)/i);
  if (urlMatch) {
    const handle = urlMatch[1].trim();
    linkedinUrl = `https://www.linkedin.com/in/${handle}`;
  }

  // 2. Top Skills Extraction
  const skillsIdx = lines.findIndex((l) => /^Top Skills$/i.test(l));
  if (skillsIdx !== -1) {
    for (let i = skillsIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^(Languages|Certifications|Honors-Awards|Summary|Publications|Patents|Experience|Education)$/i.test(line)) {
        break;
      }
      if (line && line.length < 50 && !line.includes("Page ") && !line.includes("linkedin.com")) {
        // Strip bullet points or leading dashes
        const cleanSkill = line.replace(/^[•·\-*]\s*/, "").trim();
        if (cleanSkill && !topSkills.includes(cleanSkill)) {
          topSkills.push(cleanSkill);
        }
      }
    }
  }

  // 3. Experience section: Company, Role, and Employment history
  const expIdx = lines.findIndex((l) => /^Experience$/i.test(l));
  const eduIdx = lines.findIndex((l) => /^Education$/i.test(l));
  const sumIdx = lines.findIndex((l) => /^Summary$/i.test(l));

  if (expIdx !== -1) {
    const endExpIdx = eduIdx !== -1 && eduIdx > expIdx ? eduIdx : lines.length;

    // Scan for entries under Experience
    for (let i = expIdx + 1; i < endExpIdx; i++) {
      const line = lines[i];

      // Check if line contains a date range with "Present" (indicates current role)
      if (/Present/i.test(line)) {
        if (i >= expIdx + 2) {
          // The line right before the dates is typically the Job Title
          // The line before that is typically the Company Name
          const candidateCompany = lines[i - 2];
          const candidateRole = lines[i - 1];

          if (candidateCompany && !candidateCompany.includes("Page ") && !/Experience/i.test(candidateCompany)) {
            currentCompany = candidateCompany;
          }
          if (candidateRole && !candidateRole.includes("Page ")) {
            currentRole = candidateRole;
          }
        }
      }

      // Also collect experience history items
      if (/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i.test(line) || /\d{4}\s*[-–—]\s*(?:Present|\d{4})/i.test(line)) {
        if (i >= 2) {
          const comp = lines[i - 2];
          const rol = lines[i - 1];
          if (comp && rol && !/Experience|Education/i.test(comp) && !comp.includes("Page ")) {
            experienceList.push({
              company: comp,
              role: rol,
              dates: line,
            });
          }
        }
      }
    }

    // Fallback if no "Present" keyword found in date line, grab first entry after Experience
    if (!currentCompany && expIdx + 2 < lines.length) {
      currentCompany = lines[expIdx + 1];
      currentRole = lines[expIdx + 2];
    }
  }

  // 4. Headline and Name Extraction
  // In LinkedIn PDF exports, the Name and Headline appear right before Summary or Experience
  const sidebarHeaders = ["contact", "top skills", "languages", "certifications", "honors-awards", "publications", "patents"];
  const mainAnchor = sumIdx !== -1 && (expIdx === -1 || sumIdx < expIdx) ? sumIdx : expIdx;

  if (mainAnchor !== -1) {
    let locIdx = -1;
    const headlineLines = [];
    let nameCandidate = "";

    for (let i = mainAnchor - 1; i >= 0; i--) {
      const line = lines[i];
      if (sidebarHeaders.includes(line.toLowerCase())) break;

      // Check if line looks like location
      if (locIdx === -1 && (line.includes(",") || /Area|India|United States|Canada|United Kingdom|Germany|Singapore|Australia/i.test(line))) {
        locIdx = i;
        continue;
      }

      // Headline lines usually contain @, ||, |, or role keywords
      if (
        /SWE|Engineer|Intern|Developer|Manager|Founder|Student|Analyst|Consultant|Director|Lead|Designer|Specialist|Officer|Thapar|Google|Microsoft|Amazon|Meta|Apple/i.test(line) ||
        line.includes("@") ||
        line.includes("||") ||
        line.includes("|")
      ) {
        headlineLines.unshift(line);
        continue;
      }

      // If we found headline lines, the line right above it is the Name!
      if (headlineLines.length > 0 && !nameCandidate) {
        nameCandidate = line;
        break;
      }
    }

    if (nameCandidate) {
      name = nameCandidate.replace(/[.\s]+$/, "").trim();
    }
    if (headlineLines.length > 0) {
      headline = headlineLines.join(" ").trim();
    }
  }

  // 5. Batch / Graduation Year Extraction
  // Look for patterns like: Thapar'2024, Thapar 2024, (2020 - 2024), or 2020-2024
  const batchMatch = rawText.match(/(?:Thapar['’]?\s*(\d{4})|\((\d{4})\s*[\-–—]\s*(\d{4})\)|(?:20\d{2})\s*[\-–—]\s*(20\d{2}))/i);
  if (batchMatch) {
    if (batchMatch[1]) batch = Number(batchMatch[1]);
    else if (batchMatch[3]) batch = Number(batchMatch[3]);
    else if (batchMatch[4]) batch = Number(batchMatch[4]);
  }

  // 6. Branch / Department Extraction
  if (/Computer|Software|CSE|IT|Data|Security|Cyber|Artificial Intelligence/i.test(rawText)) {
    branch = "Computer Engineering";
  } else if (/Electronics|Communication|ECE|Electrical/i.test(rawText)) {
    branch = "Electronics & Communication Engineering";
  } else if (/Mechanical|Automobile|Robotics/i.test(rawText)) {
    branch = "Mechanical Engineering";
  } else if (/Civil/i.test(rawText)) {
    branch = "Civil Engineering";
  } else if (/Chemical/i.test(rawText)) {
    branch = "Chemical Engineering";
  } else if (/Biotechnology|Biomedical/i.test(rawText)) {
    branch = "Biotechnology";
  }

  // 7. Industry Inference
  const fullCorpus = `${headline} ${currentRole} ${currentCompany} ${rawText.slice(0, 500)}`;
  const industry = inferIndustry(fullCorpus);

  // 8. Additional Technical Skills from text
  const textSkills = extractSkillsFromText(rawText);
  const combinedSkills = Array.from(new Set([...topSkills, ...textSkills])).slice(0, 10);

  // 9. Areas of Expertise
  const areasOfExpertise = extractExpertiseFromText(rawText, combinedSkills);

  // 10. Synthesized Bio
  let bio = "";
  if (currentRole && currentCompany) {
    bio = `${currentRole} at ${currentCompany}${batch ? ` · Thapar Institute Alumna/Alumnus ('${String(batch).slice(-2)})` : ""}. Passionate about technology, engineering, and mentoring students.`;
  } else if (headline) {
    bio = headline.replace(/\s*\|\|\s*/g, " · ");
  }

  return {
    name,
    currentRole: currentRole || "Software Professional",
    currentCompany: currentCompany || "Leading Firm",
    industry,
    branch,
    batch: batch || 2024,
    skills: combinedSkills,
    areasOfExpertise,
    bio,
    linkedinUrl,
    experience: experienceList.slice(0, 5),
  };
}

/**
 * Extracts and parses PDF file buffer from official LinkedIn PDF export
 */
export async function parseLinkedInPdfBuffer(buffer) {
  try {
    const parser = new PDFParse({ data: buffer });
    await parser.load();
    const result = await parser.getText();
    const text = typeof result === "string" ? result : (result?.text || "");

    if (!text || text.trim().length < 20) {
      throw new Error("PDF text content could not be extracted or the file is empty.");
    }

    const data = parseLinkedInPdfText(text);

    return {
      success: true,
      source: "linkedin_pdf_export",
      data,
    };
  } catch (error) {
    console.error("LinkedIn PDF parse error:", error);
    return {
      success: false,
      message: error.message || "Failed to parse LinkedIn PDF.",
    };
  }
}
