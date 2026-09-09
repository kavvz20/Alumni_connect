import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Avatar } from "./Avatar";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Eye,
  UserPlus,
  UploadCloud,
  Download,
  Copy,
  Check,
  FileText,
  Mail,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";

export const AdminCenterView = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState("onboarding"); // default to user provisioning
  const [alumniList, setAlumniList] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportStatusFilter, setReportStatusFilter] = useState("open");

  // =========================================================================
  // User Onboarding State
  // =========================================================================
  const [onboardMode, setOnboardMode] = useState("manual"); // "manual" | "csv"
  const [manualRole, setManualRole] = useState("alumni"); // "alumni" | "student"
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualLinkedin, setManualLinkedin] = useState("");
  const [manualDefaultPassword, setManualDefaultPassword] = useState("Thapar@2026");

  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState(null);
  const [onboardError, setOnboardError] = useState(null);
  const [copied, setCopied] = useState(false);

  // CSV Import State
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [csvImportResult, setCsvImportResult] = useState(null);
  const [csvError, setCsvError] = useState(null);

  // All Users List for Directory overview
  const [allUsersList, setAllUsersList] = useState([]);
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState("all"); // "all" | "alumni" | "student"

  const filteredDirectoryUsers = allUsersList.filter((u) => {
    if (directoryRoleFilter === "all") return true;
    return u.role === directoryRoleFilter;
  });

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const res = await api.getAlumni({ limit: 50 });
      setAlumniList(res.data || []);
    } catch (err) {
      console.error("Failed to load alumni for admin:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    if (!currentUser?._id) return;
    setLoading(true);
    try {
      const res = await api.getReports(currentUser._id, reportStatusFilter || undefined);
      setReports(res.data || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await api.getUsers();
      setAllUsersList(res.data || []);
    } catch (err) {
      console.error("Failed to load all users:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "verification") {
      fetchAlumni();
    } else if (activeTab === "moderation") {
      fetchReports();
    } else if (activeTab === "onboarding") {
      fetchAllUsers();
    }
  }, [activeTab, reportStatusFilter, currentUser]);

  const handleToggleVerify = async (userId, currentVal) => {
    try {
      await api.verifyAlumni(userId, !currentVal, currentUser._id);
      fetchAlumni();
    } catch (err) {
      alert(err.message || "Failed to update alumni verification status");
    }
  };

  const handleUpdateReport = async (reportId, status) => {
    try {
      await api.updateReportStatus(reportId, status, currentUser._id);
      fetchReports();
    } catch (err) {
      alert(err.message || "Failed to update report status");
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (!userToDelete?._id) return;
    if (userToDelete.role === "admin") {
      alert("Administrator accounts cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete '${userToDelete.name}' (${userToDelete.role})?\n\nThis will remove their account and directory profile immediately.`
    );
    if (!confirmed) return;

    try {
      await api.deleteUser(userToDelete._id, currentUser?._id);
      alert(`Account for '${userToDelete.name}' has been deleted successfully.`);
      fetchAllUsers();
      fetchAlumni();
    } catch (err) {
      alert(err.message || "Failed to delete user account.");
    }
  };

  // =========================================================================
  // Manual User Onboarding Handler
  // =========================================================================
  const handleManualOnboard = async (e) => {
    e.preventDefault();
    if (!manualName.trim() || !manualEmail.trim()) {
      setOnboardError("Full name and email address are required.");
      return;
    }

    setOnboardLoading(true);
    setOnboardError(null);
    setOnboardSuccess(null);

    const payload = {
      role: manualRole,
      name: manualName.trim(),
      email: manualEmail.trim().toLowerCase(),
      linkedinUrl: manualRole === "alumni" && manualLinkedin.trim() ? manualLinkedin.trim() : undefined,
      defaultPassword: manualDefaultPassword.trim() || "Thapar@2026",
    };

    try {
      const res = await api.onboardUser(payload, currentUser._id);
      setOnboardSuccess(res.data);
      setManualName("");
      setManualEmail("");
      setManualLinkedin("");
      fetchAllUsers();
    } catch (err) {
      setOnboardError(err.message || "Failed to provision account.");
    } finally {
      setOnboardLoading(false);
    }
  };

  // Copy credentials helper
  const handleCopyCredentials = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // =========================================================================
  // CSV Template Download
  // =========================================================================
  const handleDownloadCsvTemplate = () => {
    const csvContent = "name,email,role,linkedinUrl\n" +
      "Priya Sharma,priya.sharma@alumni.thapar.edu,alumni,https://linkedin.com/in/priyasharma\n" +
      "Aarav Gupta,aarav.gupta@thapar.edu,student,\n" +
      "Devansh Verma,devansh.verma@alumni.thapar.edu,alumni,https://linkedin.com/in/devanshverma\n" +
      "Rhea Malhotra,rhea.malhotra@thapar.edu,student,\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "thapar_users_onboard_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================================
  // CSV File Upload & Parsing
  // =========================================================================
  const handleCsvFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setCsvError(null);
    setCsvImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== "string") return;

      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        setCsvError("CSV file appears to be empty or only contains a header.");
        setCsvPreviewRows([]);
        return;
      }

      // Detect header
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const nameIdx = headers.indexOf("name");
      const emailIdx = headers.indexOf("email");
      const roleIdx = headers.indexOf("role");
      const linkedinIdx = headers.indexOf("linkedinurl") !== -1 ? headers.indexOf("linkedinurl") : headers.indexOf("linkedin");

      if (nameIdx === -1 || emailIdx === -1) {
        setCsvError("CSV header must contain at least 'name' and 'email' columns.");
        setCsvPreviewRows([]);
        return;
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.trim());
        const name = parts[nameIdx];
        const email = parts[emailIdx];
        const role = roleIdx !== -1 && parts[roleIdx] ? parts[roleIdx].toLowerCase() : "student";
        const linkedinUrl = linkedinIdx !== -1 ? parts[linkedinIdx] : "";

        if (name && email) {
          rows.push({
            name,
            email: email.toLowerCase(),
            role: role === "alumni" ? "alumni" : "student",
            linkedinUrl: linkedinUrl || undefined,
          });
        }
      }

      setCsvPreviewRows(rows);
    };

    reader.readAsText(file);
  };

  // Submit Bulk CSV Import
  const handleBulkImportSubmit = async () => {
    if (!csvPreviewRows.length) return;

    setOnboardLoading(true);
    setCsvError(null);
    setCsvImportResult(null);

    try {
      const res = await api.bulkOnboardUsers(csvPreviewRows, currentUser._id);
      setCsvImportResult(res.data);
      setCsvPreviewRows([]);
      setCsvFile(null);
      fetchAllUsers();
    } catch (err) {
      setCsvError(err.message || "Failed to process bulk import.");
    } finally {
      setOnboardLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "32px 20px" }}>
      {/* Header Banner */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "14px",
          background: "#18181b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fbf9f4",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
        }}>
          <ShieldCheck size={26} />
        </div>
        <div>
          <h1 style={{ fontSize: "2.1rem", fontWeight: 800, color: "#18181b", margin: 0 }}>
            Admin Center & User Management
          </h1>
          <p style={{ color: "#78716c", fontSize: "0.95rem", margin: 0 }}>
            Provision institutional accounts for students & alumni, dispatch default passwords, and verify credentials.
          </p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "28px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        <button
          onClick={() => setActiveTab("onboarding")}
          className={`btn ${activeTab === "onboarding" ? "btn-primary" : "btn-secondary"}`}
          style={{ whiteSpace: "nowrap", flexShrink: 0 }}
        >
          <UserPlus size={16} /> User Provisioning (Add Accounts)
        </button>

        <button
          onClick={() => setActiveTab("verification")}
          className={`btn ${activeTab === "verification" ? "btn-primary" : "btn-secondary"}`}
          style={{ whiteSpace: "nowrap", flexShrink: 0 }}
        >
          <CheckCircle2 size={16} /> Alumni Verification Queue ({alumniList.length})
        </button>

        <button
          onClick={() => setActiveTab("moderation")}
          className={`btn ${activeTab === "moderation" ? "btn-primary" : "btn-secondary"}`}
          style={{ whiteSpace: "nowrap", flexShrink: 0 }}
        >
          <AlertTriangle size={16} /> Content Moderation ({reports.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USER PROVISIONING & ONBOARDING (PRIMARY)                           */}
      {/* ========================================================================= */}
      {activeTab === "onboarding" && (
        <div>
          {/* Sub-toggle: Manual vs CSV */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
            background: "#ffffff",
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
            width: "fit-content",
            maxWidth: "100%",
            overflowX: "auto",
          }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#78716c" }}>MODE:</span>
            <button
              onClick={() => setOnboardMode("manual")}
              className={`btn btn-sm ${onboardMode === "manual" ? "btn-primary" : "btn-secondary"}`}
            >
              <UserPlus size={14} /> Manual Entry
            </button>
            <button
              onClick={() => setOnboardMode("csv")}
              className={`btn btn-sm ${onboardMode === "csv" ? "btn-primary" : "btn-secondary"}`}
            >
              <UploadCloud size={14} /> Bulk CSV Import
            </button>
          </div>

          <div className="responsive-split-grid">
            {/* Left Column: Form (Manual or CSV) */}
            <div style={{
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)",
              padding: "32px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
            }}>
              {onboardMode === "manual" ? (
                <>
                  <div style={{ marginBottom: "22px" }}>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#18181b", margin: 0 }}>
                      Manually Provision New Account
                    </h2>
                    <p style={{ fontSize: "0.84rem", color: "#78716c", margin: "4px 0 0" }}>
                      Create credentials for an alumnus or student. An automated email with their default password will be dispatched.
                    </p>
                  </div>

                  {onboardError && (
                    <div style={{ padding: "12px 16px", background: "rgba(190, 18, 60, 0.08)", border: "1px solid rgba(190, 18, 60, 0.25)", borderRadius: "8px", color: "#be123c", fontSize: "0.86rem", marginBottom: "20px" }}>
                      {onboardError}
                    </div>
                  )}

                  <form onSubmit={handleManualOnboard} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {/* Role Selector: Student vs Alumnus */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                        ACCOUNT ROLE
                      </label>
                      <div className="responsive-form-grid-2">
                        <button
                          type="button"
                          onClick={() => setManualRole("alumni")}
                          style={{
                            padding: "12px",
                            borderRadius: "var(--radius-sm)",
                            border: manualRole === "alumni" ? "2px solid #18181b" : "1px solid var(--border-color)",
                            background: manualRole === "alumni" ? "rgba(24, 24, 27, 0.06)" : "#ffffff",
                            color: manualRole === "alumni" ? "#18181b" : "#78716c",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "0.88rem",
                          }}
                        >
                          🎓 Alumnus / Mentor
                        </button>

                        <button
                          type="button"
                          onClick={() => setManualRole("student")}
                          style={{
                            padding: "12px",
                            borderRadius: "var(--radius-sm)",
                            border: manualRole === "student" ? "2px solid #18181b" : "1px solid var(--border-color)",
                            background: manualRole === "student" ? "rgba(24, 24, 27, 0.06)" : "#ffffff",
                            color: manualRole === "student" ? "#18181b" : "#78716c",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "0.88rem",
                          }}
                        >
                          📚 Student
                        </button>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                        Full Name *
                      </label>
                      <input
                        required
                        className="input-control"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                        Institutional / Personal Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        className="input-control"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="e.g. priya.sharma@alumni.thapar.edu or student@thapar.edu"
                      />
                    </div>

                    {/* LinkedIn URL (Alumni only) */}
                    {manualRole === "alumni" && (
                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                          LinkedIn Profile URL (Optional for Alumni)
                        </label>
                        <input
                          className="input-control"
                          value={manualLinkedin}
                          onChange={(e) => setManualLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    )}

                    {/* Default Password */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                        Assigned Default Password
                      </label>
                      <input
                        className="input-control"
                        value={manualDefaultPassword}
                        onChange={(e) => setManualDefaultPassword(e.target.value)}
                        placeholder="Thapar@2026"
                      />
                      <span style={{ fontSize: "0.75rem", color: "#78716c", marginTop: "4px", display: "block" }}>
                        Users will sign in with this default password and update it in their Profile section.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={onboardLoading}
                      className="btn btn-primary"
                      style={{ padding: "12px", marginTop: "8px", width: "100%" }}
                    >
                      {onboardLoading ? "Provisioning & Emailing..." : `Provision ${manualRole === "alumni" ? "Alumnus" : "Student"} & Send Email`}
                    </button>
                  </form>
                </>
              ) : (
                /* CSV Bulk Import View */
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#18181b", margin: 0 }}>
                        Bulk Import Accounts via CSV
                      </h2>
                      <p style={{ fontSize: "0.84rem", color: "#78716c", margin: "4px 0 0" }}>
                        Upload a spreadsheet of students and alumni with names and emails to provision in batch.
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadCsvTemplate}
                      className="btn btn-secondary btn-sm"
                      style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <Download size={14} /> Download Sample CSV
                    </button>
                  </div>

                  {csvError && (
                    <div style={{ padding: "12px 16px", background: "rgba(190, 18, 60, 0.08)", border: "1px solid rgba(190, 18, 60, 0.25)", borderRadius: "8px", color: "#be123c", fontSize: "0.86rem", marginBottom: "20px" }}>
                      {csvError}
                    </div>
                  )}

                  {/* Drag & Drop File Zone */}
                  <div style={{
                    border: "2px dashed rgba(24, 24, 27, 0.2)",
                    borderRadius: "var(--radius-md)",
                    padding: "36px 20px",
                    textAlign: "center",
                    background: "#fbf9f4",
                    marginBottom: "20px",
                  }}>
                    <UploadCloud size={38} color="#18181b" style={{ margin: "0 auto 12px", opacity: 0.8 }} />
                    <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#18181b", marginBottom: "6px" }}>
                      Select or Drop CSV File
                    </h4>
                    <p style={{ fontSize: "0.82rem", color: "#78716c", marginBottom: "16px" }}>
                      Accepted format: <code>.csv</code> with headers <code>name,email,role,linkedinUrl</code>
                    </p>

                    <input
                      type="file"
                      accept=".csv"
                      id="csvFileInput"
                      style={{ display: "none" }}
                      onChange={handleCsvFileChange}
                    />
                    <label
                      htmlFor="csvFileInput"
                      className="btn btn-primary btn-sm"
                      style={{ cursor: "pointer", display: "inline-flex" }}
                    >
                      Choose CSV File
                    </label>

                    {csvFile && (
                      <div style={{ marginTop: "12px", fontSize: "0.85rem", color: "#047857", fontWeight: 600 }}>
                        Selected: {csvFile.name} ({csvPreviewRows.length} valid records detected)
                      </div>
                    )}
                  </div>

                  {/* CSV Preview Table */}
                  {csvPreviewRows.length > 0 && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#18181b" }}>
                          Preview Rows to Provision ({csvPreviewRows.length})
                        </h4>
                        <button
                          onClick={handleBulkImportSubmit}
                          disabled={onboardLoading}
                          className="btn btn-primary btn-sm"
                        >
                          {onboardLoading ? "Importing..." : `Provision All ${csvPreviewRows.length} Users`}
                        </button>
                      </div>

                      <div style={{ maxHeight: "240px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
                          <thead>
                            <tr style={{ background: "#fbf9f4", borderBottom: "1px solid var(--border-color)" }}>
                              <th style={{ padding: "8px 12px" }}>Name</th>
                              <th style={{ padding: "8px 12px" }}>Email</th>
                              <th style={{ padding: "8px 12px" }}>Role</th>
                              <th style={{ padding: "8px 12px" }}>LinkedIn</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreviewRows.map((r, idx) => (
                              <tr key={idx} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{r.name}</td>
                                <td style={{ padding: "8px 12px", color: "#524f4a" }}>{r.email}</td>
                                <td style={{ padding: "8px 12px" }}>
                                  <span className={`badge badge-${r.role === "alumni" ? "amber" : "cyan"}`}>
                                    {r.role}
                                  </span>
                                </td>
                                <td style={{ padding: "8px 12px", color: "#78716c" }}>{r.linkedinUrl || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Column: Instant Credentials Card & Success Status */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Provisioning Summary Card */}
              {onboardSuccess ? (
                <div style={{
                  background: "#ffffff",
                  border: "1.5px solid #047857",
                  borderRadius: "var(--radius-lg)",
                  padding: "24px",
                  boxShadow: "0 8px 30px rgba(4, 120, 87, 0.12)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#047857", fontWeight: 800, marginBottom: "12px" }}>
                    <CheckCircle2 size={20} /> Account Provisioned Successfully!
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#524f4a", lineHeight: 1.4, marginBottom: "16px" }}>
                    Credentials have been generated and dispatched to the user's inbox:
                  </p>

                  <div style={{ background: "#fbf9f4", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(0,0,0,0.08)", fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    <div>
                      <span style={{ color: "#78716c" }}>Name:</span> <strong>{onboardSuccess.user.name}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#78716c" }}>Email:</span> <strong>{onboardSuccess.user.email}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#78716c" }}>Role:</span> <span className="badge badge-amber">{onboardSuccess.user.role}</span>
                    </div>
                    <div>
                      <span style={{ color: "#78716c" }}>Default Password:</span> <code style={{ background: "#ffffff", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(0,0,0,0.1)", fontWeight: 700 }}>{onboardSuccess.defaultPassword}</code>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyCredentials(`Email: ${onboardSuccess.user.email}\nPassword: ${onboardSuccess.defaultPassword}\nPortal: ${typeof window !== 'undefined' ? window.location.origin : ''}/login`)}
                    className="btn btn-secondary btn-sm"
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    {copied ? <><Check size={14} color="#047857" /> Copied to Clipboard!</> : <><Copy size={14} /> Copy Credentials</>}
                  </button>
                </div>
              ) : csvImportResult ? (
                <div style={{
                  background: "#ffffff",
                  border: "1.5px solid #047857",
                  borderRadius: "var(--radius-lg)",
                  padding: "24px",
                  boxShadow: "0 8px 30px rgba(4, 120, 87, 0.12)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#047857", fontWeight: 800, marginBottom: "12px" }}>
                    <CheckCircle2 size={20} /> Bulk Import Completed!
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#524f4a", lineHeight: 1.5, marginBottom: "14px" }}>
                    <div>&bull; <strong>{csvImportResult.createdCount}</strong> accounts provisioned</div>
                    <div>&bull; <strong>{csvImportResult.duplicateCount}</strong> duplicates skipped</div>
                    <div>&bull; Default password: <code>Thapar@2026</code></div>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#78716c" }}>
                    All provisioned users have been sent automated credential notices.
                  </div>
                </div>
              ) : (
                <div style={{
                  background: "#ffffff",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  padding: "24px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#18181b", marginBottom: "8px" }}>
                    Onboarding Policy
                  </h4>
                  <p style={{ fontSize: "0.82rem", color: "#524f4a", lineHeight: 1.5, margin: 0 }}>
                    In accordance with institutional security guidelines, public self-registration is closed. Accounts are strictly provisioned by the Administrator. Default passwords must be changed upon first login.
                  </p>
                </div>
              )}

              {/* Total Users Counter Card */}
              <div style={{
                background: "#ffffff",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-lg)",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "#78716c", fontWeight: 600 }}>TOTAL ACCOUNTS</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#18181b" }}>{allUsersList.length}</div>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#524f4a", textAlign: "right" }}>
                  <div>{allUsersList.filter(u => u.role === "alumni").length} Alumni</div>
                  <div>{allUsersList.filter(u => u.role === "student").length} Students</div>
                </div>
              </div>
            </div>
          </div>

          {/* Provisioned Users Directory Table */}
          <div style={{
            marginTop: "32px",
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#18181b", margin: 0 }}>
                Provisioned Accounts Directory ({filteredDirectoryUsers.length})
              </h3>

              <div style={{ display: "flex", gap: "6px" }}>
                {["all", "alumni", "student"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDirectoryRoleFilter(r)}
                    className={`btn btn-sm ${directoryRoleFilter === r ? "btn-primary" : "btn-secondary"}`}
                    style={{ textTransform: "capitalize", fontSize: "0.78rem" }}
                  >
                    {r === "all" ? `All (${allUsersList.length})` : r === "alumni" ? `Alumni (${allUsersList.filter(u => u.role === "alumni").length})` : `Students (${allUsersList.filter(u => u.role === "student").length})`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "#78716c", fontSize: "0.75rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "10px 14px" }}>Member</th>
                    <th style={{ padding: "10px 14px" }}>Email</th>
                    <th style={{ padding: "10px 14px" }}>Role</th>
                    <th style={{ padding: "10px 14px" }}>Company / Branch</th>
                    <th style={{ padding: "10px 14px" }}>Alumni Verification</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDirectoryUsers.map((u) => (
                    <tr key={u._id} style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.05)" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <Avatar user={u} size={32} borderRadius="8px" />
                          <span style={{ fontWeight: 700, color: "#18181b" }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#524f4a" }}>
                        {u.email}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className={`badge badge-${u.role === "student" ? "cyan" : u.role === "admin" ? "emerald" : "amber"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#78716c" }}>
                        {u.currentCompany || u.branch || "—"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {u.role === "alumni" ? (
                          <span className={`badge ${u.isVerified ? "badge-emerald" : "badge-amber"}`}>
                            {u.isVerified ? "Verified Alumnus" : "Pending Verification"}
                          </span>
                        ) : (
                          <span style={{ color: "#a8a29e", fontSize: "0.82rem" }}>
                            {u.role === "admin" ? "Administrator" : "—"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        {u.role !== "admin" ? (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              color: "#be123c",
                              borderColor: "rgba(190, 18, 60, 0.25)",
                              padding: "5px 10px",
                              fontSize: "0.78rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title={`Delete ${u.name}'s account`}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.78rem", color: "#a8a29e", fontStyle: "italic" }}>
                            Protected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALUMNI VERIFICATION QUEUE                                          */}
      {/* ========================================================================= */}
      {activeTab === "verification" && (
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "28px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#18181b", marginBottom: "16px" }}>
            Alumni Directory Verification ({alumniList.length})
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "#78716c", fontSize: "0.78rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 14px" }}>Alumnus</th>
                  <th style={{ padding: "12px 14px" }}>Company & Role</th>
                  <th style={{ padding: "12px 14px" }}>Batch & Branch</th>
                  <th style={{ padding: "12px 14px" }}>Verified Status</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alumniList.map((alumnus) => (
                  <tr key={alumnus._id} style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.05)" }}>
                    <td style={{ padding: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Avatar user={alumnus} size={36} borderRadius="10px" />
                        <div>
                          <div style={{ fontWeight: 700, color: "#18181b" }}>{alumnus.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "#78716c" }}>{alumnus.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px", fontSize: "0.88rem", color: "#92400e", fontWeight: 600 }}>
                      {alumnus.currentRole} {alumnus.currentCompany ? `@ ${alumnus.currentCompany}` : ""}
                    </td>
                    <td style={{ padding: "14px", fontSize: "0.85rem", color: "#524f4a" }}>
                      {alumnus.branch} ({alumnus.batch})
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span className={`badge ${alumnus.isVerified ? "badge-emerald" : "badge-amber"}`}>
                        {alumnus.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td style={{ padding: "14px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <button
                          onClick={() => handleToggleVerify(alumnus._id, alumnus.isVerified)}
                          className={`btn btn-sm ${alumnus.isVerified ? "btn-secondary" : "btn-primary"}`}
                          style={{ fontSize: "0.8rem" }}
                        >
                          {alumnus.isVerified ? "Revoke Badge" : "Grant Verified Badge"}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(alumnus)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            color: "#be123c",
                            borderColor: "rgba(190, 18, 60, 0.25)",
                            padding: "6px 9px",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                          title={`Delete ${alumnus.name}'s account`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONTENT MODERATION QUEUE                                           */}
      {/* ========================================================================= */}
      {activeTab === "moderation" && (
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "28px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#18181b", margin: 0 }}>
              Flagged Community Reports ({reports.length})
            </h2>

            <div style={{ display: "flex", gap: "8px" }}>
              {["open", "resolved", "dismissed"].map((st) => (
                <button
                  key={st}
                  onClick={() => setReportStatusFilter(st)}
                  className={`btn btn-sm ${reportStatusFilter === st ? "btn-primary" : "btn-secondary"}`}
                  style={{ textTransform: "capitalize" }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {reports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#78716c" }}>
              <CheckCircle2 size={40} color="#047857" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#18181b" }}>No reports in this view</h3>
              <p style={{ fontSize: "0.85rem" }}>The community content queue is clean and clear.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {reports.map((rep) => (
                <div key={rep._id} style={{
                  padding: "16px",
                  background: "#fbf9f4",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span className="badge badge-rose">{rep.targetType}</span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#18181b" }}>
                        Reason: {rep.reason}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#78716c" }}>
                      Reported by {rep.reportedBy?.name || "Student"} on {new Date(rep.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleUpdateReport(rep._id, "resolved")}
                      className="btn btn-primary btn-sm"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleUpdateReport(rep._id, "dismissed")}
                      className="btn btn-secondary btn-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
