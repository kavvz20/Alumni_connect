import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Avatar } from "./Avatar";
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

  const typeBadge = {
    internship: "badge-indigo",
    job: "badge-emerald",
    referral: "badge-amber",
    hackathon: "badge-rose",
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="responsive-page-header">
        <div>
          <div className="page-eyebrow"><Briefcase size={14} /> Opportunities</div>
          <h1>Career Opportunities & Referrals</h1>
          <p>Internships, jobs, hackathons and referral openings posted directly by alumni.</p>
        </div>

        {currentUser?.role === "alumni" && (
          <button onClick={onOpenPostModal} className="btn btn-primary">
            <Plus size={16} /> Post Opportunity
          </button>
        )}
      </div>

      {/* Search + type filters */}
      <form onSubmit={handleSearchSubmit} className="toolbar" style={{ marginBottom: "16px" }}>
        <div className="search-field search-field--wide">
          <Search size={16} />
          <input
            className="input-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, role or company, then press Enter"
            aria-label="Search opportunities"
          />
        </div>
        <button type="submit" className="btn btn-secondary">Search</button>
      </form>
      <div className="toolbar">
        <div className="toolbar__chips" role="group" aria-label="Opportunity type">
          {types.map((t) => (
            <button
              key={t.id || "all"}
              onClick={() => setSelectedType(t.id)}
              className={`chip${selectedType === t.id ? " active" : ""}`}
              aria-pressed={selectedType === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunity Cards Grid */}
      {loading ? (
        <div className="responsive-cards-grid" aria-busy="true" aria-label="Loading opportunities">
          {[0, 1, 2].map((i) => <div key={i} className="glass-panel skeleton-card" />)}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="empty-state">
          <Compass size={40} />
          <h3>No opportunities found</h3>
          <p>
            {search.trim() || selectedType
              ? "Try a different search or filter."
              : "Alumni haven't posted any openings yet. Check back soon."}
          </p>
        </div>
      ) : (
        <>
          <p className="results-meta">
            Showing <strong>{opportunities.length}</strong> {opportunities.length === 1 ? "opportunity" : "opportunities"}
          </p>
          <div className="responsive-cards-grid">
            {opportunities.map((opp) => {
              const canAskReferral = opp.type === "referral" || currentUser?.role === "student";
              return (
                <article key={opp._id} className="glass-panel glass-panel-hover feed-card">
                  <div className="feed-card__top">
                    <span className={`badge ${typeBadge[opp.type] || "badge-cyan"}`} style={{ textTransform: "capitalize" }}>
                      {opp.type}
                    </span>
                    {opp.createdAt && (
                      <span className="meta-row">
                        <span><Calendar size={12} /> {new Date(opp.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="feed-card__title">{opp.title}</h3>
                    {opp.company && (
                      <div className="feed-card__company">
                        <Building size={14} color="var(--accent-amber)" /> {opp.company}
                      </div>
                    )}
                  </div>

                  {opp.description && <p className="feed-card__desc">{opp.description}</p>}

                  <div className="feed-card__footer">
                    <div className="byline">
                      <Avatar user={opp.postedBy} size={30} />
                      <div style={{ minWidth: 0 }}>
                        <strong>{opp.postedBy?.name || "Alumnus"}</strong>
                        {opp.postedBy?.currentCompany ? `Alumnus · ${opp.postedBy.currentCompany}` : "Alumnus"}
                      </div>
                    </div>

                    {(opp.applyLink || canAskReferral) && (
                      <div className="feed-card__actions">
                        {opp.applyLink && (
                          <a href={opp.applyLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                            Apply <ExternalLink size={14} />
                          </a>
                        )}
                        {canAskReferral && (
                          <button
                            onClick={() => {
                              const handler = onRequestReferral || onOpenReferralFromOpportunity || onOpenReferralModal;
                              if (handler) handler(opp);
                            }}
                            className="btn btn-amber btn-sm"
                          >
                            Ask for referral
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
