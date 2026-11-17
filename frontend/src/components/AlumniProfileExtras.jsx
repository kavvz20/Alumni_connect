import React from "react";
import { ShieldCheck, Clock, AlertTriangle, XCircle, CheckCircle2, Circle, Plus, Trash2, GraduationCap, Briefcase } from "lucide-react";
import { VERIFICATION_STATUS, getVerificationStatus, SCORE_DISCLAIMER } from "../constants/institution";

const labelStyle = { display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#374151", marginBottom: "4px" };
const boxStyle = {
  background: "#fbf9f4",
  padding: "18px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const STATUS_ICON = {
  pending: Clock,
  needs_manual_review: AlertTriangle,
  verified: ShieldCheck,
  rejected: XCircle,
};

/**
 * Alumni verification status + what is still missing from the profile.
 * Shown on the alumnus's own Profile page.
 */
export const VerificationStatusCard = ({ user }) => {
  if (user?.role !== "alumni") return null;
  const status = getVerificationStatus(user);
  const meta = VERIFICATION_STATUS[status] || VERIFICATION_STATUS.pending;
  const Icon = STATUS_ICON[status] || Clock;
  const hasEvidence = Boolean(user.verification?.evidence?.source);
  const flagged = (user.verification?.flags || []).length > 0;

  const checklist = [
    { done: Boolean(user.linkedinUrl), label: "LinkedIn profile URL" },
    { done: hasEvidence, label: "LinkedIn profile PDF uploaded (LinkedIn → More → Save to PDF)" },
    { done: Boolean(user.batch), label: "Graduation year" },
    { done: Boolean(user.branch), label: "Department" },
    { done: (user.education || []).length > 0, label: "Education details" },
    ...(user.linkedinConnectRequired || user.linkedinAccount?.connected
      ? [{ done: Boolean(user.linkedinAccount?.connected), label: "LinkedIn account connected (Connect LinkedIn on this page)" }]
      : []),
  ];

  const message = {
    pending: user.profileCompleted
      ? "Your profile is waiting for review by the Alumni Relations Cell."
      : "Complete the items below so the Alumni Relations Cell can verify you.",
    needs_manual_review: flagged
      ? "An administrator needs to check this profile manually (for example, the LinkedIn profile is already linked to another account)."
      : "An administrator is reviewing your profile manually.",
    verified: "Your alumni status has been verified by the Alumni Relations Cell.",
    rejected: user.verification?.note
      ? `Verification was not approved: ${user.verification.note}`
      : "Verification was not approved. Contact the Alumni Relations Cell if you think this is a mistake.",
  }[status];

  return (
    <div
      role="status"
      style={{
        background: "#ffffff",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        marginBottom: "24px",
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        justifyContent: "space-between",
      }}
    >
      <div style={{ flex: "1 1 280px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <Icon size={20} color="#18181b" />
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#18181b", margin: 0 }}>Alumni verification</h3>
          <span className={`badge ${meta.badge}`}>{meta.label}</span>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#524f4a", margin: 0, lineHeight: 1.5 }}>{message}</p>
        {user.verification?.score && (
          <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "0.84rem" }}>
            <strong style={{ color: "#18181b" }}>Confidence score:</strong>
            <ScoreBadge score={user.verification.score} />
          </div>
        )}
      </div>

      {status !== "verified" && (
        <ul style={{ flex: "1 1 280px", listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
          {checklist.map((item) => (
            <li key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: item.done ? "#047857" : "#78716c" }}>
              {item.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {user.verification?.score?.checks?.length > 0 && (
        <details style={{ flex: "1 1 100%", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
          <summary style={{ cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, color: "#18181b" }}>
            How this score was calculated
          </summary>
          <p style={{ fontSize: "0.8rem", color: "#78716c", margin: "8px 0 12px", lineHeight: 1.5 }}>{SCORE_DISCLAIMER}</p>
          <ChecksList checks={user.verification.score.checks} />
        </details>
      )}
    </div>
  );
};

/** Confidence score with the method that produced it (rule-based evidence score vs ML model). */
export const ScoreBadge = ({ score, size = "sm" }) => {
  if (!score || typeof score.value !== "number") {
    return <span className="badge" style={{ background: "#f5f5f4", color: "#78716c" }}>Not scored</span>;
  }
  const noEvidence =
    score.method !== "ml" && Array.isArray(score.checks) && score.checks.length > 0 && score.checks.every((c) => c.result === "missing");
  if (noEvidence) {
    return (
      <span className="badge" style={{ background: "#f5f5f4", color: "#78716c", border: "1px solid rgba(26, 26, 26, 0.09)" }} title="Nothing to check yet: no LinkedIn PDF or profile details.">
        No evidence yet
      </span>
    );
  }
  const pct = Math.round(score.value * 100);
  const tone = pct >= 75 ? "badge-emerald" : pct >= 40 ? "badge-amber" : "badge-rose";
  const method = score.method === "ml" ? `ML model ${score.version || ""}`.trim() : "Rule-based evidence score";
  return (
    <span
      className={`badge ${tone}`}
      title={`${method}. Supports the admin's review; it does not prove alumni status.`}
      style={size === "lg" ? { fontSize: "1rem", padding: "6px 12px" } : undefined}
    >
      {pct}%<span style={{ fontWeight: 500, opacity: 0.85 }}>&nbsp;· {score.method === "ml" ? "ML" : "Rule-based"}</span>
    </span>
  );
};

const RESULT_STYLE = {
  match: { Icon: CheckCircle2, color: "#047857", label: "Match" },
  mismatch: { Icon: XCircle, color: "#be123c", label: "Mismatch" },
  missing: { Icon: Circle, color: "#a8a29e", label: "Missing" },
};

/** Match / mismatch / missing list (admins get full details; alumni get the public wording). */
export const ChecksList = ({ checks = [] }) => (
  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
    {checks.map((c) => {
      const s = RESULT_STYLE[c.result] || RESULT_STYLE.missing;
      return (
        <li key={c.key} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "0.84rem" }}>
          <s.Icon size={16} color={s.color} style={{ flexShrink: 0, marginTop: "2px" }} aria-label={s.label} />
          <div>
            <div style={{ fontWeight: 600, color: "#18181b" }}>
              {c.label}
              <span style={{ fontWeight: 500, color: s.color, marginLeft: "6px", fontSize: "0.76rem" }}>
                {s.label}{c.hard && c.result === "mismatch" ? " · needs review" : ""}
              </span>
            </div>
            {c.detail && <div style={{ color: "#78716c", fontSize: "0.8rem" }}>{c.detail}</div>}
          </div>
        </li>
      );
    })}
  </ul>
);

const RowActions =({ onRemove, label }) => (
  <button type="button" onClick={onRemove} className="btn btn-secondary btn-sm" aria-label={label} title={label} style={{ alignSelf: "flex-end" }}>
    <Trash2 size={14} />
  </button>
);

/** Editable list of education entries (pre-filled from the LinkedIn PDF). */
export const EducationEditor = ({ rows, onChange }) => {
  const update = (idx, key, value) => onChange(rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  const remove = (idx) => onChange(rows.filter((_, i) => i !== idx));
  const add = () => onChange([...rows, { institution: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "" }]);

  return (
    <div style={boxStyle}>
      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#18181b", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
        <GraduationCap size={18} color="#92400e" /> Education
      </h4>
      {rows.length === 0 && (
        <p style={{ fontSize: "0.82rem", color: "#78716c", margin: 0 }}>
          Upload your LinkedIn PDF above to fill this in automatically, or add your education manually.
        </p>
      )}
      {rows.map((row, idx) => (
        <div key={idx} style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", padding: "12px", background: "#ffffff", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="responsive-form-grid-2">
            <div>
              <label style={labelStyle}>College / University</label>
              <input className="input-control" value={row.institution || ""} onChange={(e) => update(idx, "institution", e.target.value)} placeholder="Thapar Institute of Engineering & Technology" />
            </div>
            <div>
              <label style={labelStyle}>Degree</label>
              <input className="input-control" value={row.degree || ""} onChange={(e) => update(idx, "degree", e.target.value)} placeholder="e.g. Bachelor of Engineering - BE" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) auto", gap: "8px", alignItems: "end" }}>
            <div>
              <label style={labelStyle}>Field of study</label>
              <input className="input-control" value={row.fieldOfStudy || ""} onChange={(e) => update(idx, "fieldOfStudy", e.target.value)} placeholder="e.g. Computer Engineering" />
            </div>
            <div>
              <label style={labelStyle}>Start</label>
              <input type="number" className="input-control" value={row.startYear ?? ""} onChange={(e) => update(idx, "startYear", e.target.value)} placeholder="2017" />
            </div>
            <div>
              <label style={labelStyle}>End</label>
              <input type="number" className="input-control" value={row.endYear ?? ""} onChange={(e) => update(idx, "endYear", e.target.value)} placeholder="2021" />
            </div>
            <RowActions onRemove={() => remove(idx)} label="Remove education entry" />
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <Plus size={14} /> Add education
      </button>
    </div>
  );
};

/** Editable list of work experience entries (pre-filled from the LinkedIn PDF). */
export const ExperienceEditor = ({ rows, onChange }) => {
  const update = (idx, key, value) => onChange(rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  const remove = (idx) => onChange(rows.filter((_, i) => i !== idx));
  const add = () => onChange([...rows, { company: "", role: "", dates: "" }]);

  return (
    <div style={boxStyle}>
      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#18181b", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
        <Briefcase size={18} color="#92400e" /> Work experience
      </h4>
      {rows.map((row, idx) => (
        <div key={idx} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto", gap: "8px", alignItems: "end" }}>
          <div>
            <label style={labelStyle}>Company</label>
            <input className="input-control" value={row.company || ""} onChange={(e) => update(idx, "company", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <input className="input-control" value={row.role || ""} onChange={(e) => update(idx, "role", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Dates</label>
            <input className="input-control" value={row.dates || ""} onChange={(e) => update(idx, "dates", e.target.value)} placeholder="July 2021 - Present" />
          </div>
          <RowActions onRemove={() => remove(idx)} label="Remove experience entry" />
        </div>
      ))}
      <button type="button" onClick={add} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <Plus size={14} /> Add experience
      </button>
    </div>
  );
};
