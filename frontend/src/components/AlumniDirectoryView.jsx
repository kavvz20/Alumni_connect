import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Avatar } from "./Avatar";
import {
  Search,
  CheckCircle2,
  Calendar,
  Briefcase,
  MessageSquare,
  Filter,
  ExternalLink,
} from "lucide-react";

export const AlumniDirectoryView = ({ currentUser, onOpenMentorshipModal, onOpenReferralModal, onStartChat }) => {
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Filter States
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [skills, setSkills] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const res = await api.getAlumni({
        search: search.trim() || undefined,
        branch: branch.trim() || undefined,
        company: company.trim() || undefined,
        industry: industry.trim() || undefined,
        skills: skills.trim() || undefined,
        isVerified: isVerified ? true : undefined,
        limit: 30,
      });
      setAlumniList(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load alumni:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, [branch, industry, isVerified]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAlumni();
  };

  return (
    <div className="page-container">
      {/* Title */}
      <div className="responsive-page-header">
        <div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800 }}>Alumni Directory</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Connect with {total} verified Thapar graduates across global engineering, product, and leadership roles.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: "18px", marginBottom: "28px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <div style={{ flex: "1 1 240px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "13px", color: "var(--text-subtle)" }} />
            <input
              className="input-control"
              style={{ paddingLeft: "42px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alumni by name, role, company, or expertise keywords..."
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
            <Search size={16} /> Search
          </button>
        </form>

        {/* Quick Dropdown Filters */}
        <div className="responsive-filter-bar">
          <div style={{ flex: "1 1 180px", minWidth: "160px" }}>
            <select
              className="select-control"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              <option value="">All Branches</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Electronics & Communication">Electronics & Comm.</option>
              <option value="Electrical Engineering">Electrical Eng.</option>
              <option value="Mechanical Engineering">Mechanical Eng.</option>
            </select>
          </div>

          <div style={{ flex: "1 1 150px", minWidth: "140px" }}>
            <select
              className="select-control"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              <option value="">All Industries</option>
              <option value="Technology">Technology</option>
              <option value="E-Commerce">E-Commerce</option>
              <option value="FinTech">FinTech</option>
              <option value="Consulting">Consulting</option>
            </select>
          </div>

          <div style={{ flex: "1 1 160px", minWidth: "140px" }}>
            <input
              className="input-control"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company filter..."
            />
          </div>

          <div style={{ flex: "1 1 160px", minWidth: "140px" }}>
            <input
              className="input-control"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Skill filter..."
            />
          </div>

          {/* Verified Toggle */}
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.85rem",
            color: isVerified ? "#6ee7b7" : "var(--text-muted)",
            cursor: "pointer",
            background: isVerified ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.05)",
            padding: "8px 14px",
            borderRadius: "var(--radius-sm)",
            border: `1px solid ${isVerified ? "rgba(16, 185, 129, 0.3)" : "var(--border-color)"}`,
            flexShrink: 0,
          }}>
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <CheckCircle2 size={16} /> Verified Only
          </label>

          {(search || branch || company || industry || skills || isVerified) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setBranch("");
                setCompany("");
                setIndustry("");
                setSkills("");
                setIsVerified(false);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent-rose)",
                fontSize: "0.82rem",
                cursor: "pointer",
                padding: "6px 10px",
                flexShrink: 0,
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          Loading alumni network...
        </div>
      ) : (
        <div className="responsive-cards-grid">
          {alumniList.map((alumnus) => (
            <div key={alumnus._id} className="glass-panel glass-panel-hover" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                {/* Header badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                  {alumnus.isVerified && (
                    <span className="badge badge-emerald">
                      <CheckCircle2 size={12} /> Verified Alumni
                    </span>
                  )}
                  {alumnus.availableForMentorshipCalls && (
                    <span className="badge badge-indigo">
                      Open to Mentor
                    </span>
                  )}
                  {alumnus.willingToRefer && (
                    <span className="badge badge-amber">
                      Willing to Refer
                    </span>
                  )}
                </div>

                {/* Profile row */}
                <div style={{ display: "flex", gap: "14px", marginBottom: "16px" }}>
                  <Avatar
                    user={alumnus}
                    size={54}
                    borderRadius="16px"
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {alumnus.name}
                      </h3>
                    </div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#fbbf24" }}>
                      {alumnus.currentRole} {alumnus.currentCompany ? `@ ${alumnus.currentCompany}` : ""}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-subtle)" }}>
                      {alumnus.branch} · Batch of {alumnus.batch}
                    </div>
                  </div>
                </div>

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
                    {alumnus.bio}
                  </p>
                )}

                {/* Skills/Expertise */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "18px" }}>
                  {(alumnus.skills || []).slice(0, 4).map((s, idx) => (
                    <span key={idx} style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "0.74rem",
                      color: "var(--text-muted)",
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  {alumnus.availableForMentorshipCalls && (
                    <button
                      onClick={() => onOpenMentorshipModal(alumnus)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <Calendar size={14} /> Request Call
                    </button>
                  )}

                  {alumnus.willingToRefer && (
                    <button
                      onClick={() => onOpenReferralModal(alumnus)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <Briefcase size={14} /> Referral
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onStartChat(alumnus)}
                  className="btn btn-secondary btn-sm"
                  style={{ width: "100%" }}
                >
                  <MessageSquare size={14} /> Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
