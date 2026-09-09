import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Avatar } from "./Avatar";
import {
  X,
  Calendar,
  Briefcase,
  Video,
  Send,
  Plus,
  Compass,
  Award,
  User,
} from "lucide-react";

/**
 * 1. Mentorship Request Modal
 */
export const MentorshipRequestModal = ({
  isOpen,
  onClose,
  targetAlumni,
  mentor,
  target,
  usersList = [],
  currentUser,
  onSuccess,
  onSwitchToStudent,
}) => {
  const initialMentor = targetAlumni || mentor || target || null;
  const [selectedMentorId, setSelectedMentorId] = useState(initialMentor?._id || "");
  const [agenda, setAgenda] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const availableMentors = usersList.filter(
    (u) => u.role === "alumni" && u._id !== currentUser?._id
  );

  const activeMentor =
    initialMentor ||
    availableMentors.find((m) => m._id === selectedMentorId) ||
    availableMentors[0] ||
    null;

  useEffect(() => {
    if (isOpen) {
      setAgenda("");
      if (initialMentor?._id) {
        setSelectedMentorId(initialMentor._id);
      } else if (availableMentors.length > 0 && !selectedMentorId) {
        setSelectedMentorId(availableMentors[0]._id);
      }
    }
  }, [isOpen, initialMentor, availableMentors.length]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agenda.trim() || !activeMentor?._id) return;

    setSubmitting(true);
    try {
      await api.createMentorshipRequest(
        {
          alumniId: activeMentor._id,
          agenda: agenda.trim(),
        },
        currentUser?._id
      );
      alert(`Mentorship request sent to ${activeMentor.name} successfully!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to send mentorship request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>Request 1-on-1 Mentorship Call</h2>
            <div style={{ fontSize: "0.85rem", color: "var(--accent-amber)" }}>
              {activeMentor ? (
                <>With {activeMentor.name} ({activeMentor.currentRole || "Alumnus"} {activeMentor.currentCompany ? `@ ${activeMentor.currentCompany}` : ""})</>
              ) : (
                "Select a verified alumnus mentor"
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {currentUser?.role !== "student" ? (
          <div>
            <div style={{ padding: "16px", background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "var(--radius-sm)", marginBottom: "20px", color: "#fde68a", fontSize: "0.9rem", lineHeight: 1.5 }}>
              ⚠️ You are currently signed in as <strong>{currentUser?.name}</strong> ({currentUser?.role}). Only students can send mentorship requests to alumni.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Close
              </button>
              {onSwitchToStudent && (
                <button
                  type="button"
                  onClick={() => {
                    onSwitchToStudent();
                  }}
                  className="btn btn-primary"
                >
                  Switch to Student & Continue
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Mentor Selector when opened globally or without preset */}
            {!initialMentor && (
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                  Select Alumni Mentor
                </label>
                <select
                  className="select-control"
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(e.target.value)}
                  required
                >
                  {availableMentors.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} — {m.currentRole || "Alumnus"} {m.currentCompany ? `@ ${m.currentCompany}` : ""} ({m.branch || "Thapar"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mentor Preview Card */}
            {activeMentor && (
              <div style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "20px",
              }}>
                <Avatar user={activeMentor} size={46} borderRadius="12px" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.98rem" }}>{activeMentor.name}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--accent-amber)" }}>
                    {activeMentor.currentRole || "Alumnus"} {activeMentor.currentCompany ? `@ ${activeMentor.currentCompany}` : ""}
                  </div>
                  {activeMentor.skills?.length > 0 && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", marginTop: "2px" }}>
                      Expertise: {Array.isArray(activeMentor.skills) ? activeMentor.skills.slice(0, 4).join(", ") : activeMentor.skills}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                Call Agenda & What You Wish To Learn
              </label>
              <textarea
                className="textarea-control"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="e.g. Would love 20 minutes to review my resume for SDE roles, discuss how you cracked Google, and get feedback on distributed system fundamentals."
                required
                style={{ minHeight: "110px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting || !activeMentor} className="btn btn-primary">
                <Send size={15} /> Send Request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/**
 * 2. Schedule Google Meet Modal
 */
export const ScheduleMeetingModal = ({ isOpen, onClose, requestItem, currentUser, onSuccess }) => {
  const [meetingScheduledAt, setMeetingScheduledAt] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [meetingLink, setMeetingLink] = useState("https://meet.google.com/abc-mentorship-call");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !requestItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.scheduleMentorshipMeeting(
        requestItem._id,
        {
          meetingScheduledAt: new Date(meetingScheduledAt),
          meetingLink: meetingLink.trim(),
          googleCalendarEventId: `cal_slot_${Date.now()}`,
        },
        currentUser?._id
      );
      alert("Mentorship meeting scheduled successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to schedule meeting.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>Schedule Google Meet Slot</h2>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Agenda: "{requestItem.agenda}"
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
              Meeting Date & Time
            </label>
            <input
              type="datetime-local"
              className="input-control"
              value={meetingScheduledAt}
              onChange={(e) => setMeetingScheduledAt(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
              Google Meet Join URL
            </label>
            <input
              type="url"
              className="input-control"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-amber">
              <Video size={15} /> Confirm & Save Slot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * 3. Referral Request Modal
 */
export const ReferralRequestModal = ({
  isOpen,
  onClose,
  targetAlumni,
  alumnus,
  target,
  opportunity,
  usersList = [],
  currentUser,
  onSuccess,
}) => {
  const availableAlumni = usersList.filter(
    (u) => u.role === "alumni" && u._id !== currentUser?._id
  );

  const initialPerson =
    targetAlumni ||
    alumnus ||
    target ||
    (opportunity?.postedBy && typeof opportunity.postedBy === "object"
      ? opportunity.postedBy
      : typeof opportunity?.postedBy === "string"
      ? availableAlumni.find((u) => u._id === opportunity.postedBy)
      : null);

  const [selectedAlumniId, setSelectedAlumniId] = useState(initialPerson?._id || "");
  const [companyName, setCompanyName] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobLink, setJobLink] = useState("");
  const [email, setEmail] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeAlumnus =
    initialPerson ||
    availableAlumni.find((a) => a._id === selectedAlumniId) ||
    availableAlumni[0] ||
    null;

  useEffect(() => {
    if (isOpen) {
      if (initialPerson?._id) {
        setSelectedAlumniId(initialPerson._id);
      } else if (availableAlumni.length > 0 && !selectedAlumniId) {
        // Try finding alumnus from same company if opportunity exists
        const matchingCompany = opportunity?.company
          ? availableAlumni.find(
              (a) =>
                a.currentCompany?.toLowerCase() ===
                opportunity.company.toLowerCase()
            )
          : null;
        setSelectedAlumniId(matchingCompany?._id || availableAlumni[0]._id);
      }

      setCompanyName(
        opportunity?.company ||
          activeAlumnus?.currentCompany ||
          "Target Company"
      );
      setJobId(
        opportunity?.title
          ? `REQ-${(opportunity._id || Date.now().toString()).slice(-4)}`
          : "SWE-2026-001"
      );
      setJobLink(opportunity?.applyLink || "https://careers.google.com/jobs");
      setEmail(currentUser?.email || "");
      setResumeUrl(
        currentUser?.resumeUrl ||
          "https://recruitsage.thapar.edu/resumes/my_resume.pdf"
      );
    }
  }, [isOpen, initialPerson, opportunity, currentUser, availableAlumni.length]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeAlumnus?._id) {
      alert("Please select an alumnus to request a referral from.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createReferralRequest(
        {
          alumniId: activeAlumnus._id,
          opportunityId: opportunity?._id,
          companyName: companyName.trim(),
          jobId: jobId.trim(),
          jobLink: jobLink.trim(),
          email: email.trim(),
          resumeUrl: resumeUrl.trim(),
        },
        currentUser?._id
      );
      alert(
        `Referral request submitted to ${activeAlumnus.name} for ${companyName} successfully!`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to submit referral request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ padding: "28px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>
              Request Internal Referral
            </h2>
            <div style={{ fontSize: "0.85rem", color: "var(--accent-amber)" }}>
              {opportunity ? (
                <>Opportunity: <strong>{opportunity.title}</strong> {opportunity.company ? `(${opportunity.company})` : ""}</>
              ) : activeAlumnus ? (
                <>Target Alumnus: <strong>{activeAlumnus.name}</strong> {activeAlumnus.currentCompany ? `@ ${activeAlumnus.currentCompany}` : ""}</>
              ) : (
                "Submit your credentials for referral"
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Alumnus Selector / Preview */}
          {!initialPerson ? (
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                }}
              >
                Select Target Alumnus
              </label>
              <select
                className="select-control"
                value={selectedAlumniId}
                onChange={(e) => setSelectedAlumniId(e.target.value)}
                required
              >
                {availableAlumni.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} — {a.currentRole || "Alumnus"} {a.currentCompany ? `@ ${a.currentCompany}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : activeAlumnus ? (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <Avatar user={activeAlumnus} size={42} borderRadius="12px" />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>
                  {activeAlumnus.name}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--accent-amber)" }}>
                  {activeAlumnus.currentRole || "Alumnus"}{" "}
                  {activeAlumnus.currentCompany ? `@ ${activeAlumnus.currentCompany}` : ""}
                </div>
              </div>
            </div>
          ) : null}

          <div
            className="responsive-form-grid-2"
            style={{ marginBottom: "14px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                }}
              >
                Company
              </label>
              <input
                className="input-control"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                }}
              >
                Company Job ID / Req
              </label>
              <input
                className="input-control"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              Job Posting URL
            </label>
            <input
              type="url"
              className="input-control"
              value={jobLink}
              onChange={(e) => setJobLink(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              Contact Email for Application
            </label>
            <input
              type="email"
              className="input-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              Verified Resume Link (RecruitSage / Drive / Portfolio)
            </label>
            <input
              type="url"
              className="input-control"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              required
            />
          </div>

          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !activeAlumnus}
              className="btn btn-amber"
            >
              <Briefcase size={15} /> Submit Referral Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * 4. Post Opportunity Modal
 */
export const PostOpportunityModal = ({ isOpen, onClose, currentUser, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("internship");
  const [company, setCompany] = useState(currentUser?.currentCompany || "");
  const [applyLink, setApplyLink] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createOpportunity(
        {
          title: title.trim(),
          type,
          company: company.trim(),
          applyLink: applyLink.trim(),
          description: description.trim(),
        },
        currentUser?._id
      );
      alert("Opportunity posted successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to post opportunity.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>Post Career Opportunity</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Title</label>
            <input
              className="input-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer 2027 SDE Intern"
              required
            />
          </div>

          <div className="responsive-form-grid-2" style={{ marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Type</label>
              <select className="select-control" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="internship">Internship</option>
                <option value="job">Full-Time Job</option>
                <option value="referral">Referral</option>
                <option value="hackathon">Hackathon</option>
                <option value="workshop">Workshop</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Company</label>
              <input
                className="input-control"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
              />
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Application URL</label>
            <input
              type="url"
              className="input-control"
              value={applyLink}
              onChange={(e) => setApplyLink(e.target.value)}
              placeholder="https://company.com/careers/..."
            />
          </div>

          <div style={{ marginBottom: "22px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Description & Qualifications</label>
            <textarea
              className="textarea-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key responsibilities, skills required, eligibility..."
              required
              style={{ minHeight: "90px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              <Compass size={15} /> Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * 5. Ask Question Modal (Forum)
 */
export const AskQuestionModal = ({ isOpen, onClose, currentUser, onSuccess }) => {
  const [question, setQuestion] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createForumPost(
        {
          question: question.trim(),
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
        currentUser?._id
      );
      alert("Question posted to the forum successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to post question.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>Ask Community Question</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Your Question
            </label>
            <textarea
              className="textarea-control"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How should I prepare for a Google L3 Software Engineer interview as a 3rd year student?"
              required
              style={{ minHeight: "100px" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Tags (comma separated)
            </label>
            <input
              className="input-control"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Google, SDE, Interview, Algorithms"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              <Send size={15} /> Post Question
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * 6. Submit Success Story Modal
 */
export const SubmitStoryModal = ({ isOpen, onClose, currentUser, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("placement");
  const [story, setStory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  if (currentUser?.role === "student") {
    return (
      <div className="modal-backdrop">
        <div className="modal-content" style={{ padding: "28px", maxWidth: "450px" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "12px" }}>Access Restricted</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
            Success stories can only be published by Alumni mentors and Administrators.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={onClose} className="btn btn-secondary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createSuccessStory(
        {
          title: title.trim(),
          category,
          story: story.trim(),
        },
        currentUser?._id
      );
      alert("Success story published successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to publish story.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>Share Your Career Journey</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Title</label>
            <input
              className="input-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. From COE 2020 to Google Cloud SWE III"
              required
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Category</label>
            <select className="select-control" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="placement">Campus Placement</option>
              <option value="internship">Internship Journey</option>
              <option value="career-transition">Career Transition</option>
              <option value="interview-experience">Interview Experience</option>
            </select>
          </div>

          <div style={{ marginBottom: "22px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Your Story & Advice</label>
            <textarea
              className="textarea-control"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Share how you prepared, lessons learned, and tips for current students..."
              required
              style={{ minHeight: "140px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-amber">
              <Award size={15} /> Publish Story
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * 7. Create Event Modal (Admin Only)
 */
export const CreateEventModal = ({ isOpen, onClose, currentUser, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16)
  );
  const [mode, setMode] = useState("online");
  const [link, setLink] = useState("https://meet.google.com/xyz-event-session");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  if (currentUser?.role !== "admin") {
    return (
      <div className="modal-backdrop">
        <div className="modal-content" style={{ padding: "28px", maxWidth: "450px" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "12px" }}>Access Restricted</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
            Only Administrators can organize campus events and webinars.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={onClose} className="btn btn-secondary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createEvent(
        {
          title: title.trim(),
          description: description.trim(),
          eventDate: new Date(eventDate),
          mode,
          link: mode === "online" ? link.trim() : undefined,
        },
        currentUser?._id
      );
      alert("Event organized successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to create event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>Organize Campus Event / Webinar</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Event Title</label>
            <input
              className="input-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Google Alumni Tech Talk: Cracking L3 Interviews"
              required
            />
          </div>

          <div className="responsive-form-grid-2" style={{ marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Event Date & Time</label>
              <input
                type="datetime-local"
                className="input-control"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Mode</label>
              <select className="select-control" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="online">Online Webinar</option>
                <option value="offline">In-Person Campus Meet</option>
              </select>
            </div>
          </div>

          {mode === "online" && (
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Webinar / Meeting URL</label>
              <input
                type="url"
                className="input-control"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                required
              />
            </div>
          )}

          <div style={{ marginBottom: "22px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Description & Agenda</label>
            <textarea
              className="textarea-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key topics, speaker background, target audience..."
              required
              style={{ minHeight: "100px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              <Calendar size={15} /> Publish Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
