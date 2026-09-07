import { User } from "../models/index.js";

const asExactCaseInsensitiveMatch = (value) =>
  new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can", "cannot", "could", "couldn't",
  "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
  "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
  "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i",
  "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's",
  "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
  "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
  "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
  "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
  "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
  "they've", "this", "those", "through", "to", "too", "under", "until", "up",
  "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
  "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
  "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
  "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
  "yourself", "yourselves", "want", "prepare", "looking", "need", "help",
  "guidance", "mentorship", "interview", "job", "internship", "like"
]);

const extractKeywords = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
};

const getAlumni = async (req, res) => {
  try {
    const {
      search,
      branch,
      batch,
      industry,
      currentRole,
      company,
      skills,
      isVerified,
      page = 1,
      limit = 10,
    } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "page must be at least 1 and limit must be between 1 and 100.",
      });
    }

    const filter = { role: "alumni" };

    if (search?.trim()) {
      filter.$text = { $search: search.trim() };
    }

    if (branch?.trim())
      filter.branch = asExactCaseInsensitiveMatch(branch.trim());
    if (industry?.trim())
      filter.industry = asExactCaseInsensitiveMatch(industry.trim());
    if (currentRole?.trim())
      filter.currentRole = asExactCaseInsensitiveMatch(currentRole.trim());
    if (company?.trim())
      filter.currentCompany = new RegExp(escapeRegex(company.trim()), "i");

    if (skills?.trim()) {
      const skillsList = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillsList.length > 0) {
        filter.skills = {
          $in: skillsList.map((s) => new RegExp(`^${escapeRegex(s)}$`, "i")),
        };
      }
    }

    if (isVerified !== undefined) {
      filter.isVerified = isVerified === "true" || isVerified === true;
    }

    if (batch !== undefined) {
      const batchNumber = Number(batch);

      if (!Number.isInteger(batchNumber)) {
        return res.status(400).json({
          success: false,
          message: "batch must be a valid year.",
        });
      }

      filter.batch = batchNumber;
    }

    const [alumni, total] = await Promise.all([
      User.find(filter)
        .select("-firebaseUid -__v")
        .sort(
          search?.trim() ? { score: { $meta: "textScore" } } : { createdAt: -1 }
        )
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: alumni,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get alumni error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch alumni profiles.",
    });
  }
};

/**
 * AI Alumni Mentor Matching Engine
 * Reference: Data Model Section 9 & Presentation Deck Slide 5
 * Evaluates student's free-text careerGoal, skills, branch, and preferred industry
 * against verified & available alumni.
 */
const matchAlumniMentor = async (req, res) => {
  try {
    let { careerGoal, branch, skills = [], industry, limit = 5 } = req.body;
    const maxResults = Math.min(Math.max(Number(limit) || 5, 1), 20);

    // If authenticated student, pull missing profile attributes from DB
    if (req.user && req.user.role === "student") {
      careerGoal = careerGoal || req.user.careerGoal;
      branch = branch || req.user.branch;
      if (!skills.length && req.user.skills?.length) skills = req.user.skills;
    }

    if (!careerGoal?.trim()) {
      return res.status(400).json({
        success: false,
        message: "careerGoal text is required for AI mentor matching.",
      });
    }

    const goalKeywords = extractKeywords(careerGoal);
    const studentSkills = (Array.isArray(skills) ? skills : [skills])
      .map((s) => s?.toLowerCase().trim())
      .filter(Boolean);
    const studentBranch = branch?.toLowerCase().trim();
    const studentIndustry = industry?.toLowerCase().trim();

    // Fetch all alumni available for mentorship calls
    const candidates = await User.find({
      role: "alumni",
      availableForMentorshipCalls: true,
    }).select("-firebaseUid -__v");

    if (!candidates.length) {
      return res.status(200).json({
        success: true,
        message: "No alumni are currently available for mentorship calls.",
        data: [],
      });
    }

    const scoredAlumni = candidates.map((alumnus) => {
      let keywordScore = 0;
      let skillsScore = 0;
      let branchScore = 0;
      let industryScore = 0;
      let verifiedScore = alumnus.isVerified ? 10 : 0;

      // 1. Keyword overlap (bio, areasOfExpertise, currentRole, industry, skills)
      const alumniCorpus = [
        alumnus.bio || "",
        alumnus.currentRole || "",
        alumnus.industry || "",
        alumnus.currentCompany || "",
        ...(alumnus.areasOfExpertise || []),
        ...(alumnus.skills || []),
      ]
        .join(" ")
        .toLowerCase();

      for (const kw of goalKeywords) {
        if (alumniCorpus.includes(kw)) {
          keywordScore += 10;
        }
      }

      // 2. Skills & Expertise overlap
      const alumniSkillsSet = new Set(
        [
          ...(alumnus.skills || []),
          ...(alumnus.areasOfExpertise || []),
        ].map((s) => s.toLowerCase().trim())
      );

      for (const sk of studentSkills) {
        if (alumniSkillsSet.has(sk)) {
          skillsScore += 15;
        } else {
          for (const ask of alumniSkillsSet) {
            if (ask.includes(sk) || sk.includes(ask)) {
              skillsScore += 8;
              break;
            }
          }
        }
      }

      // 3. Branch match
      if (studentBranch && alumnus.branch?.toLowerCase().trim() === studentBranch) {
        branchScore += 20;
      }

      // 4. Industry match
      if (
        studentIndustry &&
        alumnus.industry?.toLowerCase().trim() === studentIndustry
      ) {
        industryScore += 25;
      } else if (
        goalKeywords.some((kw) =>
          alumnus.industry?.toLowerCase().includes(kw)
        )
      ) {
        industryScore += 15;
      }

      const totalScore =
        keywordScore * 1.5 +
        skillsScore * 1.2 +
        branchScore * 1.0 +
        industryScore * 1.2 +
        verifiedScore +
        10; // baseline for availableForMentorshipCalls

      // Determine the primary reason tag
      let reasonTag = "Open to Mentor";
      const componentScores = [
        { tag: "Same Branch", score: branchScore },
        { tag: "Similar Journey", score: skillsScore + (branchScore > 0 ? 10 : 0) },
        { tag: "Industry Match", score: industryScore },
        { tag: "Career Alignment", score: keywordScore },
      ];

      componentScores.sort((a, b) => b.score - a.score);
      if (componentScores[0].score > 0) {
        reasonTag = componentScores[0].tag === "Career Alignment" ? "Similar Journey" : componentScores[0].tag;
      }

      return {
        alumni: alumnus,
        score: Math.round(totalScore),
        reasonTag,
        breakdown: {
          keywordScore,
          skillsScore,
          branchScore,
          industryScore,
          isVerified: alumnus.isVerified,
        },
      };
    });

    // Rank descending by score and return top N
    scoredAlumni.sort((a, b) => b.score - a.score);
    const topMatches = scoredAlumni.slice(0, maxResults);

    return res.status(200).json({
      success: true,
      data: topMatches.map(({ alumni, score, reasonTag, breakdown }) => ({
        ...alumni.toObject(),
        matchScore: score,
        reasonTag,
        matchBreakdown: breakdown,
      })),
      totalMatches: scoredAlumni.length,
    });
  } catch (error) {
    console.error("Match alumni mentor error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to calculate mentor recommendations.",
    });
  }
};

export { getAlumni, matchAlumniMentor };
