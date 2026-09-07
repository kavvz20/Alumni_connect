import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import mongoose from "mongoose";
import connectDB from "./index.js";
import {
  User,
  Opportunity,
  ForumPost,
  Comment,
  Event,
  SuccessStory,
} from "../models/index.js";

export const seedDatabase = async () => {
  try {
    const existingAlumniCount = await User.countDocuments({ role: "alumni" });
    if (existingAlumniCount >= 3) {
      console.log("Database already has sufficient seed data.");
      return;
    }

    console.log("Seeding realistic demonstration data for Alumni Connect...");

    // 1. Users
    const student = await User.findOneAndUpdate(
      { email: "aarav.sharma@thapar.edu" },
      {
        role: "student",
        name: "Aarav Sharma",
        email: "aarav.sharma@thapar.edu",
        firebaseUid: "demo_student_aarav",
        branch: "Computer Engineering",
        batch: 2025,
        skills: ["React", "Node.js", "Python", "Data Structures"],
        bio: "Final year Computer Engineering student passionate about distributed systems and cloud engineering.",
        careerGoal: "I want to prepare for software engineering and distributed systems internships at top tech companies.",
        resumeUrl: "https://recruitsage.thapar.edu/resumes/aarav_sharma.pdf",
        linkedinUrl: "https://linkedin.com/in/aarav-sharma-demo",
        githubUrl: "https://github.com/aarav-demo",
      },
      { upsert: true, new: true }
    );

    const alumni1 = await User.findOneAndUpdate(
      { email: "priya.patel@alumni.thapar.edu" },
      {
        role: "alumni",
        name: "Priya Patel",
        email: "priya.patel@alumni.thapar.edu",
        firebaseUid: "demo_alumni_priya",
        branch: "Computer Engineering",
        batch: 2020,
        currentCompany: "Google",
        currentRole: "Software Engineer III",
        industry: "Technology",
        skills: ["React", "Node.js", "AWS", "System Design", "Go"],
        areasOfExpertise: ["Distributed Systems", "Cloud Architecture", "SDE Interview Prep"],
        bio: "SWE III at Google Cloud. Thapar COE '20 alumnus. Happy to mentor aspiring software engineers and review system design concepts.",
        availableForMentorshipCalls: true,
        willingToRefer: true,
        isVerified: true,
        linkedinUrl: "https://linkedin.com/in/priya-patel-demo",
        githubUrl: "https://github.com/priya-demo",
      },
      { upsert: true, new: true }
    );

    const alumni2 = await User.findOneAndUpdate(
      { email: "rohan.gupta@alumni.thapar.edu" },
      {
        role: "alumni",
        name: "Rohan Gupta",
        email: "rohan.gupta@alumni.thapar.edu",
        firebaseUid: "demo_alumni_rohan",
        branch: "Computer Engineering",
        batch: 2018,
        currentCompany: "Microsoft",
        currentRole: "Senior Product Manager",
        industry: "Technology",
        skills: ["Product Strategy", "Roadmapping", "System Architecture", "Agile"],
        areasOfExpertise: ["Product Management", "PM Interview Prep", "Startup Transitions"],
        bio: "Senior PM at Microsoft leading Developer Platform experiences. Ex-Flipkart APM. Guiding students breaking into tech product roles.",
        availableForMentorshipCalls: true,
        willingToRefer: true,
        isVerified: true,
        linkedinUrl: "https://linkedin.com/in/rohan-gupta-demo",
      },
      { upsert: true, new: true }
    );

    const alumni3 = await User.findOneAndUpdate(
      { email: "ananya.verma@alumni.thapar.edu" },
      {
        role: "alumni",
        name: "Ananya Verma",
        email: "ananya.verma@alumni.thapar.edu",
        firebaseUid: "demo_alumni_ananya",
        branch: "Electronics & Communication",
        batch: 2021,
        currentCompany: "Amazon",
        currentRole: "SDE II",
        industry: "E-Commerce",
        skills: ["Java", "Spring Boot", "Microservices", "DynamoDB"],
        areasOfExpertise: ["Backend Architecture", "Low-Level Design", "Amazon Leadership Principles"],
        bio: "SDE II at Amazon. Transitioned from ECE to Software Engineering. Open for resume reviews and interview prep tips.",
        availableForMentorshipCalls: true,
        willingToRefer: false,
        isVerified: true,
        linkedinUrl: "https://linkedin.com/in/ananya-verma-demo",
      },
      { upsert: true, new: true }
    );

    const admin = await User.findOneAndUpdate(
      { email: "placement.cell@thapar.edu" },
      {
        role: "admin",
        name: "Placement Cell Admin",
        email: "placement.cell@thapar.edu",
        firebaseUid: "demo_admin_cell",
      },
      { upsert: true, new: true }
    );

    // 2. Opportunities
    await Opportunity.findOneAndUpdate(
      { title: "Software Engineering Intern - Summer 2027" },
      {
        postedBy: alumni1._id,
        type: "internship",
        title: "Software Engineering Intern - Summer 2027",
        description: "Google Cloud team is looking for passionate students skilled in distributed systems and systems programming for 3-month summer internship.",
        company: "Google",
        applyLink: "https://careers.google.com/jobs/results/internship-2027",
      },
      { upsert: true }
    );

    await Opportunity.findOneAndUpdate(
      { title: "Associate Product Manager (APM) Referral" },
      {
        postedBy: alumni2._id,
        type: "referral",
        title: "Associate Product Manager (APM) Referral",
        description: "Accepting referral requests for 2025/2026 graduates interested in product management at Microsoft. Drop your RecruitSage resume link.",
        company: "Microsoft",
        applyLink: "https://careers.microsoft.com/jobs/apm-referral",
      },
      { upsert: true }
    );

    // 3. Forum Posts & Comments
    const post1 = await ForumPost.findOneAndUpdate(
      { question: "How to prepare for Amazon SDE-1 coding and leadership principle rounds?" },
      {
        authorId: student._id,
        question: "How to prepare for Amazon SDE-1 coding and leadership principle rounds?",
        tags: ["Amazon", "SDE", "Interview", "Algorithms"],
      },
      { upsert: true, new: true }
    );

    await Comment.findOneAndUpdate(
      { postId: post1._id, authorId: alumni3._id },
      {
        postId: post1._id,
        authorId: alumni3._id,
        text: "Make sure you prepare 2-3 detailed STAR format stories for each of the 16 Leadership Principles. For coding, practice medium LeetCode questions focusing on BFS/DFS, Trees, and Dynamic Programming.",
      },
      { upsert: true }
    );

    // 4. Events
    await Event.findOneAndUpdate(
      { title: "Crack the Top Tier Tech Interview: Alumni AMA" },
      {
        organizerId: admin._id,
        title: "Crack the Top Tier Tech Interview: Alumni AMA",
        description: "Join Priya Patel (Google) and Rohan Gupta (Microsoft) for an interactive AMA session on resumes, system design fundamentals, and networking.",
        eventDate: new Date(Date.now() + 5 * 86400000),
        mode: "online",
        link: "https://meet.google.com/xyz-connect-ama",
      },
      { upsert: true }
    );

    // 5. Success Stories
    await SuccessStory.findOneAndUpdate(
      { title: "Journey from Tier-1 College to Google Cloud" },
      {
        authorId: alumni1._id,
        title: "Journey from Tier-1 College to Google Cloud",
        story: "Consistent competitive programming, active open source participation, and seeking mentorship from seniors through Alumni Connect helped me land my dream offer.",
        category: "placement",
      },
      { upsert: true }
    );

    console.log("Seed data initialization completed successfully!");
  } catch (err) {
    console.error("Seed database error:", err);
  }
};

// If run directly
if (process.argv[1]?.endsWith("seed.js")) {
  connectDB().then(async () => {
    await seedDatabase();
    await mongoose.disconnect();
    process.exit(0);
  });
}
