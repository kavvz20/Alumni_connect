import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  User,
} from "lucide-react";

export const AlumniDirectoryView = ({ currentUser, onOpenMentorshipModal, onOpenReferralModal, onStartChat }) => {
  const navigate = useNavigate();
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
    <div className="page-container" data-accent="bronze">
      {/* Title */}
      <div className="responsive-page-header">
        <div>
          <div className="page-eyebrow"><User size={14} /> Alumni Network</div>
          <h1>Alumni Directory</h1>
          <p>
            Connect with {total} Thapar graduates across engineering, product and leadership roles.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: "18px", marginBottom: "28px" }}>
        <form onSubmit={handleSearchSubmit} role="search" aria-label="Search alumni network" style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <div style={{ flex: "1 1 240px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "13px", color: "var(--text-subtle)" }} />
            <input
              id="alumni-search-input"
              name="search"
              aria-label="Search alumni by name, role, company, or expertise keywords"
              className="input-control"
              style={{ paddingLeft: "42px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alumni by name, role, company, or expertise keywords..."
            />
          </div>

          <button type="submit" aria-label="Search alumni" className="btn btn-primary" style={{ flexShrink: 0 }}>
            <Search size={16} /> Search
          </button>
        </form>

        {/* Quick Dropdown Filters */}
        <div className="responsive-filter-bar" role="region" aria-label="Filter Options">
          <div style={{ flex: "1 1 180px", minWidth: "160px" }}>
            <select
              id="filter-branch"
              name="branch"
              aria-label="Filter by Branch"
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
              id="filter-industry"
              name="industry"
              aria-label="Filter by Industry"
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
              id="filter-company"
              name="company"
              aria-label="Filter by Company"
              className="input-control"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company filter..."
            />
          </div>

          <div style={{ flex: "1 1 160px", minWidth: "140px" }}>
            <input
              id="filter-skills"
              name="skills"
              aria-label="Filter by Skill"
              className="input-control"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Skill filter..."
            />
          </div>

          {/* Verified Toggle */}
          <label 
            htmlFor="filter-verified"
            style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.85rem",
            color: isVerified ? "var(--accent-emerald)" : "var(--text-muted)",
            cursor: "pointer",
            background: isVerified ? "rgba(4, 120, 87, 0.08)" : "#ffffff",
            padding: "0 14px",
            minHeight: "44px",
            fontWeight: 600,
            borderRadius: "var(--radius-sm)",
            border: `1px solid ${isVerified ? "rgba(4, 120, 87, 0.25)" : "rgba(24, 24, 27, 0.16)"}`,
            flexShrink: 0,
          }}>
            <input
              id="filter-verified"
              name="isVerified"
              aria-label="Filter verified alumni only"
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
        <div className="responsive-cards-grid" aria-busy="true" aria-label="Loading alumni">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass-panel skeleton-card" />
          ))}
        </div>
      ) : alumniList.length === 0 ? (
        <div className="empty-state">
          <Search size={28} />
          <h3>No alumni match these filters</h3>
          <p>Try a broader search, or clear the filters to see everyone.</p>
        </div>
      ) : (
        <>
          <div className="results-meta">
            Showing <strong>{alumniList.length}</strong> {alumniList.length === 1 ? "alumnus" : "alumni"}
          </div>
          <div className="responsive-cards-grid">
            {alumniList.map((alumnus) => (
              <article key={alumnus._id} className="glass-panel glass-panel-hover alumni-card">
                {/* Identity */}
                <div
                  className="alumni-card__identity"
                  onClick={() => navigate(`/profile/${alumnus._id}`)}
                  title="View profile"
                >
                  <Avatar user={alumnus} size={56} borderRadius="16px" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="alumni-card__name">
                      <span>{alumnus.name}</span>
                    </h3>
                    {(alumnus.currentRole || alumnus.currentCompany) && (
                      <div className="alumni-card__role">
                        {alumnus.currentRole}
                        {alumnus.currentCompany ? <span> · {alumnus.currentCompany}</span> : null}
                      </div>
                    )}
                    <div className="alumni-card__meta">
                      {[alumnus.branch, alumnus.batch ? `Class of ${alumnus.batch}` : null].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>

                {alumnus.bio && <p className="alumni-card__bio">{alumnus.bio}</p>}

                {(alumnus.skills || []).length > 0 && (
                  <div className="tag-list">
                    {alumnus.skills.slice(0, 4).map((s, idx) => (
                      <span key={idx} className="tag">{s}</span>
                    ))}
                    {alumnus.skills.length > 4 && <span className="tag tag--more">+{alumnus.skills.length - 4}</span>}
                  </div>
                )}

                <div className="alumni-card__offers">
                  {alumnus.isVerified ? (
                    <span className="badge badge-emerald">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  ) : (
                    <span className="badge badge-rose" title="The Alumni Relations Cell has not verified this profile yet">
                      Not verified
                    </span>
                  )}
                  {alumnus.availableForMentorshipCalls && <span className="badge badge-teal">Open to mentorship</span>}
                  {alumnus.willingToRefer && <span className="badge badge-terracotta">Open to referrals</span>}
                </div>

                {/* Actions */}
                <div className="alumni-card__actions">
                  {alumnus.availableForMentorshipCalls && (
                    <button
                      type="button"
                      aria-label={`Request mentorship call with ${alumnus.name}`}
                      onClick={() => onOpenMentorshipModal(alumnus)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <Calendar size={14} /> Request call
                    </button>
                  )}
                  {alumnus.willingToRefer && (
                    <button
                      type="button"
                      aria-label={`Request referral from ${alumnus.name}`}
                      onClick={() => onOpenReferralModal(alumnus)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <Briefcase size={14} /> Referral
                    </button>
                  )}
                  {!alumnus.availableForMentorshipCalls && !alumnus.willingToRefer && (
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${alumnus._id}`)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <User size={14} /> View profile
                    </button>
                  )}
                  {(alumnus.availableForMentorshipCalls || alumnus.willingToRefer) && (
                    <button
                      type="button"
                      aria-label={`View profile of ${alumnus.name}`}
                      title="View profile"
                      onClick={() => navigate(`/profile/${alumnus._id}`)}
                      className="btn btn-secondary btn-sm icon-btn"
                    >
                      <User size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Chat with ${alumnus.name}`}
                    title="Chat"
                    onClick={() => onStartChat(alumnus)}
                    className="btn btn-secondary btn-sm icon-btn"
                  >
                    <MessageSquare size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
