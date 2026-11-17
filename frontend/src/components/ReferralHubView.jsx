import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Avatar } from "./Avatar";
import {
  Briefcase,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Building,
  Plus,
} from "lucide-react";

export const ReferralHubView = ({
  currentUser,
  onOpenNewReferralModal,
  onRequestReferral,
  onStartChat,
}) => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [error, setError] = useState(null);

  const fetchReferrals = async () => {
    if (!currentUser?._id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReferralRequests(currentUser._id, filterStatus || undefined);
      setReferrals(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load referrals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [currentUser, filterStatus]);

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await api.updateReferralStatus(requestId, status, currentUser._id);
      fetchReferrals();
    } catch (err) {
      alert(err.message || "Failed to update referral status");
    }
  };

  return (
    <div className="page-container" data-accent="sky">
      {/* Title */}
      <div className="responsive-page-header">
        <div>
          <div className="page-eyebrow"><Briefcase size={14} /> Referrals</div>
          <h1>Referral Hub</h1>
          <p>
            {currentUser?.role === "student"
              ? "Request direct job & internship referrals from verified alumni at top companies."
              : "Review and act on student referral applications for open roles at your company."}
          </p>
        </div>

        {currentUser?.role === "student" && (
          <button
            onClick={() => {
              if (onRequestReferral) onRequestReferral();
              else if (onOpenNewReferralModal) onOpenNewReferralModal();
            }}
            className="btn btn-amber"
          >
            <Plus size={16} /> Request Referral
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="toolbar"><div className="toolbar__chips" role="group" aria-label="Status">
        {["", "pending", "approved", "rejected", "cancelled"].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`chip${filterStatus === st ? " active" : ""}`} aria-pressed={filterStatus === st} style={{ textTransform: "capitalize" }}
          >
            {st || "All"}
          </button>
        ))}
      </div></div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {/* Referral Cards */}
      {loading ? (
        <div className="list-stack" aria-busy="true" aria-label="Loading referrals">
          {[0, 1, 2].map((i) => <div key={i} className="glass-panel skeleton-row" style={{ height: "150px" }} />)}
        </div>
      ) : referrals.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={40} />
          <h3>No Referral Applications Found</h3>
          <p>
            {currentUser?.role === "student"
              ? "Browse the Opportunities tab or Alumni Directory to ask for verified internal referrals."
              : "No students have requested referrals under this status."}
          </p>
        </div>
      ) : (
        <div className="list-stack" style={{ gap: "16px" }}>
          {referrals.map((item) => {
            const isStudent = item.studentId?._id === currentUser?._id;
            const counterpart = isStudent ? item.alumniId : item.studentId;

            const statusColors = {
              pending: "badge-amber",
              approved: "badge-emerald",
              rejected: "badge-rose",
              cancelled: "badge-rose",
            };

            return (
              <div key={item._id} className="glass-panel glass-panel-hover" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <Avatar user={counterpart} size={48} borderRadius="14px" />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <Building size={16} color="#92400e" />
                        <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                          {item.companyName}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-subtle)" }}>
                          · Job ID: #{item.jobId}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.86rem", color: "var(--text-muted)" }}>
                        {isStudent
                          ? `Target Alumni: ${counterpart?.name} (${counterpart?.currentRole || "Engineer"})`
                          : `Applicant: ${counterpart?.name} (${counterpart?.branch || "Student"}, Batch ${counterpart?.batch || ""})`}
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${statusColors[item.status] || "badge-indigo"}`}>
                    {item.status}
                  </span>
                </div>

                {/* Job Link & Resume Preview Bar */}
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "16px",
                  padding: "12px 16px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "16px",
                }}>
                  <a
                    href={item.jobLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--accent-cyan)" }}
                  >
                    <ExternalLink size={14} /> Open Portal Job Posting
                  </a>

                  <a
                    href={item.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--accent-emerald)" }}
                  >
                    <FileText size={14} /> View Verified Resume (RecruitSage)
                  </a>

                  <span style={{ fontSize: "0.82rem", color: "var(--text-subtle)", marginLeft: "auto" }}>
                    Contact: {item.email}
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "10px" }}>
                  {!isStudent && item.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(item._id, "rejected")}
                        className="btn btn-secondary btn-sm"
                        style={{ color: "var(--accent-rose)" }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(item._id, "approved")}
                        className="btn btn-amber btn-sm"
                      >
                        <CheckCircle2 size={14} /> Submit Internal Referral
                      </button>
                    </>
                  )}

                  {isStudent && item.status === "pending" && (
                    <button
                      onClick={() => handleStatusUpdate(item._id, "cancelled")}
                      className="btn btn-secondary btn-sm"
                      style={{ color: "var(--accent-rose)" }}
                    >
                      Withdraw Application
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
