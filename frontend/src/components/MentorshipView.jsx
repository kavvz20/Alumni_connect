import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Avatar } from "./Avatar";
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
    <div className="page-container" data-accent="sage">
      {/* Title */}
      <div className="responsive-page-header">
        <div>
          <div className="page-eyebrow"><Video size={14} /> Mentorship</div>
          <h1>Mentorship & Google Meet Hub</h1>
          <p>
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
      <div className="toolbar"><div className="toolbar__chips" role="group" aria-label="Status">
        {["", "pending", "accepted", "completed", "rejected"].map((st) => (
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

      {/* Request Cards */}
      {loading ? (
        <div className="list-stack" aria-busy="true" aria-label="Loading mentorship requests">
          {[0, 1, 2].map((i) => <div key={i} className="glass-panel skeleton-row" style={{ height: "150px" }} />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <Calendar size={40} />
          <h3>No Mentorship Requests Found</h3>
          <p>
            {currentUser?.role === "student"
              ? "Browse alumni profiles or use AI Mentor Match to send your first call request."
              : "You do not have any mentorship requests under this status filter."}
          </p>
        </div>
      ) : (
        <div className="list-stack" style={{ gap: "16px" }}>
          {requests.map((req) => {
            const isStudent = req.studentId?._id === currentUser?._id;
            const isAlumni = req.alumniId?._id === currentUser?._id;
            const counterpart = isStudent ? req.alumniId : req.studentId;

            const statusColors = {
              pending: "badge-amber",
              accepted: "badge-emerald",
              rejected: "badge-rose",
              cancelled: "badge-rose",
              completed: "badge-sky",
            };

            return (
              <div key={req._id} className="glass-panel glass-panel-hover" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "14px" }}>
                    <Avatar
                      user={counterpart}
                      size={48}
                      borderRadius="14px"
                    />

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
                <div className="inset" style={{ marginBottom: "16px" }}>
                  <div className="inset__label">Call agenda</div>
                  <div style={{ fontSize: "0.92rem", color: "var(--text-main)", lineHeight: 1.6 }}>
                    {req.agenda}
                  </div>
                </div>

                {/* Meeting Link / Scheduled Info */}
                {req.meetingScheduledAt && (
                  <div className="inset inset--success" style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Video size={20} color="#047857" />
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--accent-emerald)" }}>
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
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
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
