import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Avatar } from "./Avatar";
import {
  Sparkles,
  Search,
  CheckCircle2,
  Calendar,
  Briefcase,
  MessageSquare,
  Award,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

export const AIMentorMatchView = ({ currentUser, onOpenMentorshipModal, onOpenReferralModal, onStartChat }) => {
  const [careerGoal, setCareerGoal] = useState(
    currentUser?.careerGoal || "I want to prepare for software engineering and distributed systems internships at top tech companies."
  );
  const [branch, setBranch] = useState(currentUser?.branch || "Computer Engineering");
  const [skills, setSkills] = useState(currentUser?.skills?.join(", ") || "React, Node.js, Distributed Systems");
  const [industry, setIndustry] = useState("Technology");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);

  // Suggested prompt pills
  const samplePrompts = [
    "I want to prepare for SDE interviews at Amazon or Google.",
    "Looking for guidance on breaking into Product Management at high-growth startups.",
    "Interested in transitioning from Electronics to Cloud Architecture and DevOps.",
    "Seeking mock interviews for System Design and backend microservices.",
  ];

  const handleMatch = async (goalToUse) => {
    const targetGoal = goalToUse || careerGoal;
    if (!targetGoal.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.matchAlumniMentor(
        {
          careerGoal: targetGoal,
          branch: branch?.trim(),
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          industry: industry?.trim(),
          limit: 6,
        },
        currentUser?._id
      );

      setMatches(res.data || []);
      setHasSearched(true);
    } catch (err) {
      setError(err.message || "Failed to calculate mentor matches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run initial recommendation if user has a career goal
    if (careerGoal) {
      handleMatch(careerGoal);
    }
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 20px" }}>
      {/* Hero Header */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 16px",
          background: "rgba(245, 158, 11, 0.12)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          borderRadius: "var(--radius-full)",
          color: "var(--accent-amber)",
          fontSize: "0.82rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}>
          <Sparkles size={16} /> Signature Feature
        </div>

        <h1 style={{
          fontSize: "2.8rem",
          fontWeight: 800,
          marginBottom: "12px",
          background: "linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          AI Alumni Mentor Matching
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: "680px", margin: "0 auto" }}>
          Describe your career goal in plain language. Our algorithm analyzes verified alumni profiles, career journeys, and expertise to recommend your best-fit mentors.
        </p>
      </div>

      {/* Main Prompt Card */}
      <div className="glass-panel" style={{ padding: "28px", marginBottom: "40px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute",
          top: "-60px",
          right: "-60px",
          width: "200px",
          height: "200px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
            YOUR CAREER GOAL & ASPIRATION
          </label>
          <textarea
            className="textarea-control"
            value={careerGoal}
            onChange={(e) => setCareerGoal(e.target.value)}
            placeholder="e.g., I want to prepare for product management internships and software architecture roles..."
            style={{ fontSize: "1.05rem", padding: "14px 18px", minHeight: "100px" }}
          />
        </div>

        {/* Quick Sample Prompts */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-subtle)", alignSelf: "center" }}>Try:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCareerGoal(p);
                handleMatch(p);
              }}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-full)",
                color: "var(--text-muted)",
                fontSize: "0.78rem",
                padding: "4px 12px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-glow)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-color)")}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Advanced Filters Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-color)", paddingTop: "18px" }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <SlidersHorizontal size={16} />
            {showAdvanced ? "Hide Fine-Tuning" : "Fine-Tune Profile Parameters"}
          </button>

          <button
            onClick={() => handleMatch()}
            disabled={loading}
            className="btn btn-amber"
            style={{ padding: "12px 28px", fontSize: "1rem" }}
          >
            {loading ? (
              <>
                <Sparkles size={18} className="animate-spin" /> Scoring Alumni...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Match Top Mentors <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Advanced Drawer */}
        {showAdvanced && (
          <div style={{
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px dashed var(--border-color)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Branch</label>
              <input
                className="input-control"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Computer Engineering"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Your Key Skills</label>
              <input
                className="input-control"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. React, Node.js, Python"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Preferred Industry</label>
              <input
                className="input-control"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Technology"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      {hasSearched && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem" }}>Recommended Mentors ({matches.length})</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
              Ranked by semantic goal overlap, skill alignment, branch match, and willingness to mentor.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: "16px", background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "var(--radius-sm)", color: "#fda4af", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Matches Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
        gap: "24px",
      }}>
        {matches.map((alumnus, idx) => {
          const reasonTag = alumnus.reasonTag || "Open to Mentor";
          const matchScore = Math.min(Math.round(alumnus.matchScore || 85), 99);

          const tagColor = 
            reasonTag === "Same Branch" ? "badge-emerald" :
            reasonTag === "Similar Journey" ? "badge-amber" :
            reasonTag === "Industry Match" ? "badge-cyan" : "badge-indigo";

          return (
            <div key={alumnus._id || idx} className="glass-panel glass-panel-hover" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                {/* Header with Match Score & Reason Badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span className={`badge ${tagColor}`}>
                    {reasonTag}
                  </span>

                  {/* Circular Match Score Indicator */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    padding: "3px 10px",
                    borderRadius: "var(--radius-full)",
                  }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#a5b4fc" }}>{matchScore}%</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-subtle)", textTransform: "uppercase" }}>Match</span>
                  </div>
                </div>

                {/* Profile Info */}
                <div style={{ display: "flex", gap: "14px", marginBottom: "16px" }}>
                  <Avatar user={alumnus} size={56} borderRadius="16px" />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {alumnus.name}
                      </h3>
                      {alumnus.isVerified && (
                        <CheckCircle2 size={16} color="#10b981" title="Admin Verified Alumni" />
                      )}
                    </div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#fbbf24" }}>
                      {alumnus.currentRole} {alumnus.currentCompany ? `@ ${alumnus.currentCompany}` : ""}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-subtle)" }}>
                      {alumnus.branch} · Class of {alumnus.batch}
                    </div>
                  </div>
                </div>

                {/* Bio snippet */}
                {alumnus.bio && (
                  <p style={{
                    fontSize: "0.86rem",
                    color: "var(--text-muted)",
                    marginBottom: "16px",
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    "{alumnus.bio}"
                  </p>
                )}

                {/* Areas of Expertise / Skills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                  {(alumnus.areasOfExpertise || alumnus.skills || []).slice(0, 4).map((exp, i) => (
                    <span key={i} style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}>
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => onOpenMentorshipModal(alumnus)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Calendar size={15} /> Book Mentorship
                  </button>

                  {alumnus.willingToRefer && (
                    <button
                      onClick={() => onOpenReferralModal(alumnus)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <Briefcase size={15} /> Ask Referral
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onStartChat(alumnus)}
                  className="btn btn-secondary btn-sm"
                  style={{ width: "100%" }}
                >
                  <MessageSquare size={15} /> Direct Chat
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hasSearched && matches.length === 0 && !loading && (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>
            No mentors found currently matching your criteria with mentorship availability enabled.
          </p>
        </div>
      )}
    </div>
  );
};
