import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Video,
  ExternalLink,
  Plus,
} from "lucide-react";

export const MentorshipView = ({ currentUser, onScheduleMeeting, onOpenNewRequestModal }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    if (!currentUser?._id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMentorshipRequests(currentUser._id, filterStatus || undefined);
      setRequests(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load mentorship requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentUser, filterStatus]);

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await api.updateMentorshipStatus(requestId, status, currentUser._id);
      fetchRequests();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  return (
    <div className="page-container">
      {/* Title */}
      <div className="responsive-page-header">
        <div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800 }}>Mentorship & Google Meet Hub</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            {currentUser?.role === "student"
              ? "Manage your 1-on-1 mentorship calls, track approvals, and join scheduled Google Meets."
              : "Review incoming mentorship requests from students, schedule calls, and share meeting links."}
          </p>
        </div>

        {currentUser?.role === "student" && (
          <button onClick={onOpenNewRequestModal} className="btn btn-primary">
            <Plus size={16} /> New Request
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
        {["", "pending", "accepted", "completed", "rejected"].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            style={{
              padding: "7px 16px",
              borderRadius: "var(--radius-sm)",
              border: filterStatus === st ? "1px solid var(--accent-primary)" : "1px solid var(--border-color)",
              background: filterStatus === st ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.04)",
              color: filterStatus === st ? "#fff" : "var(--text-muted)",
              fontFamily: "var(--font-heading)",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {st || "All Requests"}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "16px", background: "rgba(244, 63, 94, 0.15)", borderRadius: "8px", color: "#fda4af", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Request Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          Loading mentorship requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-panel" style={{ padding: "50px", textAlign: "center" }}>
          <Calendar size={48} style={{ color: "var(--text-subtle)", marginBottom: "16px" }} />
          <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>No Mentorship Requests Found</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {currentUser?.role === "student"
              ? "Browse alumni profiles or use AI Mentor Match to send your first call request."
              : "You do not have any mentorship requests under this status filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {requests.map((req) => {
            const isStudent = req.studentId?._id === currentUser?._id;
            const isAlumni = req.alumniId?._id === currentUser?._id;
            const counterpart = isStudent ? req.alumniId : req.studentId;

            const statusColors = {
              pending: "badge-amber",
              accepted: "badge-emerald",
              rejected: "badge-rose",
              cancelled: "badge-rose",
              completed: "badge-indigo",
            };

            return (
              <div key={req._id} className="glass-panel glass-panel-hover" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "14px" }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                    }}>
                      {counterpart?.name?.[0] || "U"}
                    </div>

                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {isStudent ? "Target Mentor" : "Student Applicant"}
                      </div>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
                        {counterpart?.name}
                      </h3>
                      <div style={{ fontSize: "0.85rem", color: "var(--accent-amber)" }}>
                        {counterpart?.currentRole
                          ? `${counterpart.currentRole} ${counterpart.currentCompany ? `@ ${counterpart.currentCompany}` : ""}`
                          : `${counterpart?.branch || "Student"} · Batch ${counterpart?.batch || ""}`}
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${statusColors[req.status] || "badge-indigo"}`}>
                    {req.status}
                  </span>
                </div>

                {/* Agenda */}
                <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "14px 18px", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-subtle)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                    Call Agenda & Focus Areas
                  </div>
                  <div style={{ fontSize: "0.92rem", color: "var(--text-main)" }}>
                    "{req.agenda}"
                  </div>
                </div>

                {/* Meeting Link / Scheduled Info */}
                {req.meetingScheduledAt && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: "16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Video size={20} color="#10b981" />
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#6ee7b7" }}>
                          Scheduled for: {new Date(req.meetingScheduledAt).toLocaleString()}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Google Calendar slot confirmed
                        </div>
                      </div>
                    </div>

                    {req.meetingLink && (
                      <a
                        href={req.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-amber btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <Video size={15} /> Join Google Meet <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                  {/* Alumni actions for pending */}
                  {isAlumni && req.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(req._id, "rejected")}
                        className="btn btn-secondary btn-sm"
                        style={{ color: "var(--accent-rose)" }}
                      >
                        <XCircle size={14} /> Decline
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(req._id, "accepted")}
                        className="btn btn-primary btn-sm"
                      >
                        <CheckCircle2 size={14} /> Accept Request
                      </button>
                    </>
                  )}

                  {/* Schedule button for participants */}
                  {(isAlumni || isStudent) && (req.status === "accepted" || (isAlumni && req.status === "pending")) && (
                    <button
                      onClick={() => onScheduleMeeting(req)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Calendar size={14} /> {req.meetingScheduledAt ? "Reschedule Call" : "Schedule Meeting"}
                    </button>
                  )}

                  {/* Student cancel for pending */}
                  {isStudent && req.status === "pending" && (
                    <button
                      onClick={() => handleStatusUpdate(req._id, "cancelled")}
                      className="btn btn-secondary btn-sm"
                      style={{ color: "var(--accent-rose)" }}
                    >
                      Cancel Request
                    </button>
                  )}

                  {/* Complete meeting */}
                  {(isAlumni || isStudent) && req.status === "accepted" && (
                    <button
                      onClick={() => handleStatusUpdate(req._id, "completed")}
                      className="btn btn-secondary btn-sm"
                    >
                      Mark Completed
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
