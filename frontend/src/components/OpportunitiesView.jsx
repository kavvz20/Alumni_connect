import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  Compass,
  Briefcase,
  ExternalLink,
  Plus,
  Building,
  Calendar,
  Search,
} from "lucide-react";

export const OpportunitiesView = ({
  currentUser,
  onOpenPostModal,
  onRequestReferral,
  onOpenReferralFromOpportunity,
  onOpenReferralModal,
}) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [search, setSearch] = useState("");

  const types = [
    { id: "", label: "All Opportunities" },
    { id: "internship", label: "Internships" },
    { id: "job", label: "Full-Time Jobs" },
    { id: "hackathon", label: "Hackathons" },
    { id: "referral", label: "Referral Openings" },
    { id: "workshop", label: "Workshops" },
  ];

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await api.getOpportunities({
        type: selectedType || undefined,
        search: search.trim() || undefined,
        limit: 30,
      });
      setOpportunities(res.data || []);
    } catch (err) {
      console.error("Failed to load opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [selectedType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOpportunities();
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="responsive-page-header">
        <div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800 }}>Career Opportunities & Referrals</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Explore verified internships, jobs, hackathons, and company referral openings directly posted by alumni.
          </p>
        </div>

        {currentUser?.role === "alumni" && (
          <button onClick={onOpenPostModal} className="btn btn-primary">
            <Plus size={16} /> Post Opportunity
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="glass-panel" style={{ padding: "18px 20px", marginBottom: "28px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          {/* Types Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: selectedType === t.id ? "1px solid var(--accent-primary)" : "1px solid var(--border-color)",
                  background: selectedType === t.id ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.04)",
                  color: selectedType === t.id ? "#fff" : "var(--text-muted)",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", flex: "1 1 220px", maxWidth: "340px", gap: "8px" }}>
            <input
              className="input-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, role, company..."
              style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
            />
            <button type="submit" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
              <Search size={15} />
            </button>
          </form>
        </div>
      </div>

      {/* Opportunity Cards Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          Loading opportunities...
        </div>
      ) : opportunities.length === 0 ? (
        <div className="glass-panel" style={{ padding: "50px", textAlign: "center" }}>
          <Compass size={48} style={{ color: "var(--text-subtle)", marginBottom: "16px" }} />
          <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>No Opportunities Found</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Check back soon or switch your role to an Alumnus to post a new opening.
          </p>
        </div>
      ) : (
        <div className="responsive-cards-grid">
          {opportunities.map((opp) => {
            const badgeTypeColor =
              opp.type === "internship" ? "badge-indigo" :
              opp.type === "job" ? "badge-emerald" :
              opp.type === "referral" ? "badge-amber" :
              opp.type === "hackathon" ? "badge-rose" : "badge-cyan";

            return (
              <div key={opp._id} className="glass-panel glass-panel-hover" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  {/* Type Badge & Company */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <span className={`badge ${badgeTypeColor}`}>
                      {opp.type}
                    </span>

                    {opp.company && (
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-amber)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Building size={14} /> {opp.company}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>
                    {opp.title}
                  </h3>

                  <p style={{
                    fontSize: "0.88rem",
                    color: "var(--text-muted)",
                    marginBottom: "18px",
                    lineHeight: 1.5,
                  }}>
                    {opp.description}
                  </p>
                </div>

                {/* Posted By & Actions */}
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-subtle)", marginBottom: "12px" }}>
                    Posted by: <strong style={{ color: "var(--text-main)" }}>{opp.postedBy?.name || "Alumnus"}</strong> {opp.postedBy?.currentCompany ? `(${opp.postedBy.currentCompany})` : ""}
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    {opp.applyLink && (
                      <a
                        href={opp.applyLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                      >
                        Apply on Portal <ExternalLink size={14} />
                      </a>
                    )}

                    {(opp.type === "referral" || currentUser?.role === "student") && (
                      <button
                        onClick={() => {
                          const handler = onRequestReferral || onOpenReferralFromOpportunity || onOpenReferralModal;
                          if (handler) handler(opp);
                        }}
                        className="btn btn-amber btn-sm"
                        style={{ flex: 1 }}
                      >
                        Ask Referral
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
