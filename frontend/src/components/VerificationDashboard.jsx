import React, { useCallback, useEffect, useState } from "react";
import { X, Search, RefreshCw, ExternalLink, ShieldCheck, XCircle, AlertTriangle, Trash2, FileText } from "lucide-react";
import { api } from "../services/api";
import { Avatar } from "./Avatar";
import { ScoreBadge, ChecksList } from "./AlumniProfileExtras";
import { VERIFICATION_STATUS, SCORE_DISCLAIMER } from "../constants/institution";

const FILTERS = [
  { value: "open", label: "Open" },
  { value: "needs_manual_review", label: "Needs review" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const SOURCE_LABEL = { admin_manual: "Added by admin", admin_csv: "Admin CSV import", self_registered: "Self-registered" };

const thStyle = { padding: "12px 14px" };
const tdStyle = { padding: "14px 16px", fontSize: "0.86rem", color: "#524f4a", verticalAlign: "middle" };
const sectionTitle = { fontSize: "0.82rem", fontWeight: 800, color: "#18181b", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" };

const StatusBadge = ({ status }) => {
  const meta = VERIFICATION_STATUS[status] || VERIFICATION_STATUS.pending;
  return <span className={`badge ${meta.badge}`}>{meta.label}</span>;
};

const educationSummary = (u) => {
  const e = (u.education || []).find((x) => /thapar|tiet/i.test(x.institution || "")) || (u.education || [])[0];
  if (e) return [e.degree, e.fieldOfStudy, e.endYear].filter(Boolean).join(" · ") || e.institution;
  return [u.branch, u.batch].filter(Boolean).join(" · ") || "—";
};

const LinkedinLink = ({ url }) =>
  url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#0a66c2", display: "inline-flex", alignItems: "center", gap: "4px", wordBreak: "break-all" }}>
      {url.replace(/^https?:\/\/(www\.)?/, "")} <ExternalLink size={12} />
    </a>
  ) : (
    <span>—</span>
  );

// ---------------------------------------------------------------------------
// Review panel
// ---------------------------------------------------------------------------
const ReviewPanel = ({ userId, onClose, onDecided }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.getVerificationDetail(userId);
      setData(res.data);
      setNote(res.data.user.verification?.note || "");
    } catch (err) {
      setError(err.message || "Could not load this profile.");
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (decision) => {
    if (decision === "rejected" && !note.trim()) {
      setError("Please write a reason before rejecting. The alumnus will see it.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.decideVerification(userId, decision, note.trim());
      onDecided();
    } catch (err) {
      setError(err.message || "Could not save the decision.");
    } finally {
      setBusy(false);
    }
  };

  const rescore = async () => {
    setBusy(true);
    try {
      await api.rescoreVerification(userId);
      await load();
    } catch (err) {
      setError(err.message || "Could not recompute the score.");
    } finally {
      setBusy(false);
    }
  };

  const u = data?.user;
  const v = u?.verification || {};
  const ev = v.evidence?.source ? v.evidence : null;
  const ex = ev?.extracted || {};
  const record = v.adminRecord || {};

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <div className="modal-content" style={{ maxWidth: "860px", width: "100%", padding: "28px", maxHeight: "90vh", overflowY: "auto", background: "#ffffff", color: "#18181b" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h2 id="review-title" style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>{u ? u.name : "Loading…"}</h2>
            {u && (
              <div style={{ fontSize: "0.84rem", color: "#78716c", marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                <span>{u.email}</span>
                <LinkedinLink url={u.linkedinUrl} />
                <span>{SOURCE_LABEL[u.profileSource] || "Source unknown"}</span>
                <StatusBadge status={v.status} />
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" aria-label="Close review panel">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div role="alert" style={{ padding: "10px 14px", background: "rgba(190,18,60,0.08)", border: "1px solid rgba(190,18,60,0.25)", borderRadius: "8px", color: "#be123c", fontSize: "0.84rem", marginBottom: "14px" }}>
            {error}
          </div>
        )}

        {u && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Score */}
            <section style={{ background: "#fbf9f4", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "var(--radius-sm)", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <strong>Confidence score</strong>
                  <ScoreBadge score={v.score} size="lg" />
                </div>
                <button type="button" onClick={rescore} disabled={busy} className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <RefreshCw size={14} /> Recompute
                </button>
              </div>
              <p style={{ fontSize: "0.78rem", color: "#78716c", margin: "0 0 14px", lineHeight: 1.5 }}>
                {v.score?.method === "ml"
                  ? `Calibrated probability from ML model ${v.score.version} (rule-based evidence score: ${Math.round((v.score.ruleValue ?? 0) * 100)}%). `
                  : "Rule-based evidence score (not a machine-learning prediction). "}
                {SCORE_DISCLAIMER}
              </p>
              <ChecksList checks={v.score?.checks || []} />
            </section>

            {(v.flags || []).length > 0 && (
              <section>
                <h3 style={sectionTitle}>Warnings</h3>
                {v.flags.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", fontSize: "0.84rem", color: "#92400e" }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <span>{f.detail || f.type}</span>
                  </div>
                ))}
              </section>
            )}

            {/* Side-by-side sources */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "16px" }}>
              <section>
                <h3 style={sectionTitle}>Profile (self-reported)</h3>
                <dl style={{ margin: 0, fontSize: "0.84rem", display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px" }}>
                  <dt style={{ color: "#78716c" }}>Department</dt><dd style={{ margin: 0 }}>{u.branch || "—"}</dd>
                  <dt style={{ color: "#78716c" }}>Grad. year</dt><dd style={{ margin: 0 }}>{u.batch || "—"}</dd>
                  <dt style={{ color: "#78716c" }}>Company</dt><dd style={{ margin: 0 }}>{u.currentCompany || "—"}</dd>
                  <dt style={{ color: "#78716c" }}>Designation</dt><dd style={{ margin: 0 }}>{u.currentRole || "—"}</dd>
                </dl>
              </section>
              <section>
                <h3 style={sectionTitle}>Institution record (admin)</h3>
                <dl style={{ margin: 0, fontSize: "0.84rem", display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px" }}>
                  <dt style={{ color: "#78716c" }}>Department</dt><dd style={{ margin: 0 }}>{record.branch || "—"}</dd>
                  <dt style={{ color: "#78716c" }}>Grad. year</dt><dd style={{ margin: 0 }}>{record.batch || "—"}</dd>
                  <dt style={{ color: "#78716c" }}>Degree</dt><dd style={{ margin: 0 }}>{record.degree || "—"}</dd>
                </dl>
              </section>
              <section>
                <h3 style={sectionTitle}>LinkedIn PDF (extracted)</h3>
                {ev ? (
                  <dl style={{ margin: 0, fontSize: "0.84rem", display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px" }}>
                    <dt style={{ color: "#78716c" }}>Name</dt><dd style={{ margin: 0 }}>{ev.fieldsFound?.includes("name") ? ex.name : "—"}</dd>
                    <dt style={{ color: "#78716c" }}>Company</dt><dd style={{ margin: 0 }}>{ev.fieldsFound?.includes("currentCompany") ? ex.currentCompany : "—"}</dd>
                    <dt style={{ color: "#78716c" }}>Designation</dt><dd style={{ margin: 0 }}>{ev.fieldsFound?.includes("currentRole") ? ex.currentRole : "—"}</dd>
                    <dt style={{ color: "#78716c" }}>Uploaded</dt><dd style={{ margin: 0 }}>{ev.extractedAt ? new Date(ev.extractedAt).toLocaleDateString() : "—"}</dd>
                  </dl>
                ) : (
                  <p style={{ fontSize: "0.84rem", color: "#78716c", margin: 0, display: "flex", gap: "6px" }}>
                    <FileText size={16} /> No LinkedIn PDF uploaded yet.
                  </p>
                )}
              </section>
            </div>

            {ev && (
              <section>
                <h3 style={sectionTitle}>Education in the LinkedIn PDF</h3>
                {(ex.education || []).length ? (
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.84rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {ex.education.map((e, i) => (
                      <li key={i}>
                        <strong>{e.institution}</strong>
                        {[e.degree, e.fieldOfStudy].filter(Boolean).length ? ` — ${[e.degree, e.fieldOfStudy].filter(Boolean).join(", ")}` : ""}
                        {e.startYear || e.endYear ? ` (${e.startYear || "?"} – ${e.endYear || "?"})` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: "0.84rem", color: "#78716c", margin: 0 }}>No education section found in the PDF.</p>
                )}
                {(ex.experience || []).length > 0 && (
                  <>
                    <h3 style={{ ...sectionTitle, marginTop: "14px" }}>Experience in the LinkedIn PDF</h3>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.84rem" }}>
                      {ex.experience.map((x, i) => (
                        <li key={i}>{x.role} at {x.company}{x.dates ? ` — ${x.dates}` : ""}</li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            )}

            {(data.history || []).length > 0 && (
              <section>
                <h3 style={sectionTitle}>Decision history</h3>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.8rem", color: "#524f4a" }}>
                  {data.history.map((h) => (
                    <li key={h._id}>
                      {new Date(h.decidedAt).toLocaleString()}: <strong>{(VERIFICATION_STATUS[h.decision] || {}).label || h.decision}</strong>
                      {h.decidedBy ? ` by ${h.decidedBy.name}` : ""}
                      {typeof h.scoreAtDecision === "number" ? ` (score ${Math.round(h.scoreAtDecision * 100)}%)` : ""}
                      {h.note ? ` — "${h.note}"` : ""}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Decision */}
            <section style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
              <label htmlFor="review-note" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Note (required to reject; shown to the alumnus if rejected)
              </label>
              <textarea
                id="review-note"
                className="textarea-control"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Confirmed against the 2019 convocation list"
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
                <button type="button" disabled={busy} onClick={() => decide("verified")} className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={16} /> Approve as verified
                </button>
                <button type="button" disabled={busy} onClick={() => decide("needs_manual_review")} className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <AlertTriangle size={16} /> Needs manual review
                </button>
                <button type="button" disabled={busy} onClick={() => decide("rejected")} className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#be123c", borderColor: "rgba(190,18,60,0.3)" }}>
                  <XCircle size={16} /> Reject
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Which scoring method is active (rule-based vs ML) and progress towards training data
// ---------------------------------------------------------------------------
const ALGORITHM_LABEL = { random_forest: "Random Forest", logistic_regression: "Logistic Regression" };

const ScoringStatus = ({ info }) => {
  if (!info) return null;
  const l = info.labels || {};
  const cv = info.model?.crossValidation;
  const box = {
    background: "#fbf9f4",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    fontSize: "0.82rem",
    color: "#524f4a",
    lineHeight: 1.6,
    marginBottom: "16px",
  };
  return (
    <div style={box} role="note">
      <strong style={{ color: "#18181b" }}>Scoring method: </strong>
      {info.active ? (
        <>
          ML model <strong>{info.model.version}</strong> ({ALGORITHM_LABEL[info.model.algorithm] || info.model.algorithm}), trained on{" "}
          {info.model.trainingCounts.total} admin decisions
          {cv?.roc_auc ? `; cross-validated ROC-AUC ${cv.roc_auc.mean.toFixed(2)}, Brier ${cv.brier.mean.toFixed(3)}` : ""}.
        </>
      ) : (
        <>Rule-based evidence score (not machine learning). {info.reason}</>
      )}
      <div>
        Labelled decisions so far: <strong>{l.total}</strong> ({l.verified} verified, {l.rejected} rejected). Training needs at least{" "}
        {l.minimumTotal}, with {l.minimumPerClass} of each.{" "}
        {l.readyToTrain
          ? "Enough data: run `npm run ml:export` in backend/, then `python train.py` in ml/, then “Recompute all scores”."
          : "Keep approving and rejecting real profiles; every decision becomes training data."}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------
export const VerificationDashboard = ({ onDeleteUser, onCountsChange }) => {
  const [filter, setFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewId, setReviewId] = useState(null);
  const [rescoring, setRescoring] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);

  const loadModelInfo = useCallback(async () => {
    try {
      const res = await api.getVerificationModelInfo();
      setModelInfo(res.data);
    } catch (_) {
      setModelInfo(null);
    }
  }, []);

  useEffect(() => {
    loadModelInfo();
  }, [loadModelInfo]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getVerificationQueue({ status: filter, search: search.trim(), limit: 50 });
      setItems(res.data || []);
      setCounts(res.counts || {});
      if (onCountsChange) onCountsChange(res.counts || {});
    } catch (err) {
      setError(err.message || "Could not load the verification queue.");
    } finally {
      setLoading(false);
    }
  }, [filter, search, onCountsChange]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const countFor = (f) =>
    f === "open"
      ? (counts.pending || 0) + (counts.needs_manual_review || 0)
      : f === "all"
        ? Object.values(counts).reduce((a, b) => a + b, 0)
        : counts[f] || 0;

  const rescoreAll = async () => {
    setRescoring(true);
    try {
      await api.rescoreAllVerifications();
      await Promise.all([load(), loadModelInfo()]);
    } catch (err) {
      setError(err.message || "Could not recompute scores.");
    } finally {
      setRescoring(false);
    }
  };

  return (
    <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "clamp(20px, 3vw, 32px)", boxShadow: "var(--shadow-subtle)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
        <h2 style={{ fontWeight: 800, color: "#18181b", margin: 0 }}>Alumni Verification Requests</h2>
        <button type="button" onClick={rescoreAll} disabled={rescoring} className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <RefreshCw size={14} className={rescoring ? "spin-animation" : undefined} /> Recompute all scores
        </button>
      </div>
      <p style={{ fontSize: "0.9rem", color: "#78716c", margin: "0 0 20px", lineHeight: 1.6, maxWidth: "820px" }}>{SCORE_DISCLAIMER}</p>
      <ScoringStatus info={modelInfo} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", margin: "20px 0 16px" }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`chip${filter === f.value ? " active" : ""}`}
          >
            {f.label}
            <span className="chip__count">{countFor(f.value)}</span>
          </button>
        ))}
        <div style={{ position: "relative", marginLeft: "auto", minWidth: "min(100%, 260px)" }}>
          <Search size={16} style={{ position: "absolute", left: "13px", top: "14px", color: "#8c857b" }} />
          <input
            className="input-control"
            style={{ paddingLeft: "38px" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company"
            aria-label="Search verification requests"
          />
        </div>
      </div>

      {error && <div role="alert" className="alert alert-error">{error}</div>}

      <div className="table-responsive-wrapper">
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              <th style={thStyle}>Alumnus</th>
              <th style={thStyle}>LinkedIn</th>
              <th style={thStyle}>Education / Grad. year</th>
              <th style={thStyle}>Company & designation</th>
              <th style={thStyle}>Score</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: "center", padding: "48px 16px", color: "#78716c" }}>
                  <strong style={{ display: "block", color: "#18181b", marginBottom: "4px" }}>Nothing here</strong>
                  No alumni match this filter{search ? " and search" : ""}.
                </td>
              </tr>
            )}
            {items.map((u) => (
              <tr key={u._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={tdStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar user={{ ...u, role: "alumni" }} size={36} borderRadius="10px" />
                    <div>
                      <div style={{ fontWeight: 700, color: "#18181b" }}>{u.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#78716c" }}>{u.email}</div>
                      {!u.verification?.evidence?.source && (
                        <div style={{ fontSize: "0.72rem", color: "#a8a29e" }}>No LinkedIn PDF yet</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ ...tdStyle, maxWidth: "200px" }}><LinkedinLink url={u.linkedinUrl} /></td>
                <td style={tdStyle}>{educationSummary(u)}</td>
                <td style={{ ...tdStyle, color: "#92400e", fontWeight: 600 }}>
                  {[u.currentRole, u.currentCompany].filter(Boolean).join(" @ ") || "—"}
                </td>
                <td style={tdStyle}><ScoreBadge score={u.verification?.score} /></td>
                <td style={tdStyle}>
                  <StatusBadge status={u.verification?.status} />
                  {(u.verification?.flags || []).length > 0 && (
                    <div style={{ fontSize: "0.72rem", color: "#92400e", marginTop: "4px" }}>⚠ {u.verification.flags.length} warning(s)</div>
                  )}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                  <button type="button" onClick={() => setReviewId(u._id)} className="btn btn-primary btn-sm" style={{ marginRight: "8px" }}>
                    Review
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (await onDeleteUser({ ...u, role: "alumni" })) load();
                    }}
                    className="btn btn-secondary btn-sm icon-btn"
                    style={{ color: "#be123c" }}
                    title={`Delete ${u.name}'s account`}
                    aria-label={`Delete ${u.name}'s account`}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reviewId && (
        <ReviewPanel
          userId={reviewId}
          onClose={() => setReviewId(null)}
          onDecided={() => {
            setReviewId(null);
            load();
            loadModelInfo();
          }}
        />
      )}
    </div>
  );
};
