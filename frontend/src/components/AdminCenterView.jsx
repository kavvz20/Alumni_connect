import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../services/api";
import { Avatar } from "./Avatar";
import { VerificationDashboard } from "./VerificationDashboard";
import { VERIFICATION_STATUS, getVerificationStatus } from "../constants/institution";
import { usableParsedFields } from "../services/parsedProfile";
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
  Sparkles,
  RefreshCw,
  Upload,
} from "lucide-react";

export const AdminCenterView = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState("onboarding"); // default to user provisioning
  const [openVerificationCount, setOpenVerificationCount] = useState(null);
  const [reports, setReports] = useState([]);
  const [, setLoading] = useState(false);
  const [reportStatusFilter, setReportStatusFilter] = useState("open");

  // =========================================================================
  // User Onboarding State
  // =========================================================================
  const [onboardMode, setOnboardMode] = useState("manual"); // "manual" | "csv"
  const [manualRole, setManualRole] = useState("alumni"); // "alumni" | "student"
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualLinkedin, setManualLinkedin] = useState("");

  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState(null);
  const [onboardError, setOnboardError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Manual LinkedIn Scrape state
  const [manualScrapedData, setManualScrapedData] = useState(null);
  // Signed LinkedIn PDF parse result; the server stores it as the alumnus's verification evidence
  const [manualEvidenceToken, setManualEvidenceToken] = useState(null);

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

  const handleVerificationCounts = useCallback((counts) => {
    setOpenVerificationCount((counts.pending || 0) + (counts.needs_manual_review || 0));
  }, []);

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
    if (activeTab === "moderation") {
      fetchReports();
    } else if (activeTab === "onboarding") {
      fetchAllUsers();
    }
  }, [activeTab, reportStatusFilter, currentUser]);

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
    if (userToDelete.role === "admin" || userToDelete.isAdmin) {
      alert("Administrator accounts cannot be deleted.");
      return false;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete '${userToDelete.name}' (${userToDelete.role})?\n\nThis will remove their account and directory profile immediately.`
    );
    if (!confirmed) return false;

    try {
      await api.deleteUser(userToDelete._id, currentUser?._id);
      alert(`Account for '${userToDelete.name}' has been deleted successfully.`);
      fetchAllUsers();
      return true;
    } catch (err) {
      alert(err.message || "Failed to delete user account.");
      return false;
    }
  };

  // Manual LinkedIn Scrape & PDF State
  const manualPdfInputRef = useRef(null);
  const [manualPdfLoading, setManualPdfLoading] = useState(false);

  // Manual LinkedIn PDF Upload handler
  const handleManualPdfUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setOnboardError("Please select a valid PDF file exported from LinkedIn.");
      return;
    }

    setManualPdfLoading(true);
    setOnboardError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target?.result;
        const res = await api.parseLinkedInPdf(base64Data, null, currentUser?._id);
        if (res?.data) {
          const d = res.data;
          if (d.name) {
            setManualName(d.name);
          }
          if (d.linkedinUrl) {
            setManualLinkedin(d.linkedinUrl);
          }
          setManualScrapedData(d);
          setManualEvidenceToken(res.evidenceToken || null);
        }
      } catch (err) {
        setOnboardError("LinkedIn PDF parse error: " + (err.message || "Failed to parse LinkedIn PDF file."));
      } finally {
        setManualPdfLoading(false);
      }
    };
    reader.readAsDataURL(file);
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
      // With a PDF, the server uses its own signed parse result; otherwise only the found fields are sent.
      evidenceToken: manualRole === "alumni" && manualEvidenceToken ? manualEvidenceToken : undefined,
      enrichmentData:
        manualRole === "alumni" && manualScrapedData && !manualEvidenceToken
          ? Object.fromEntries(Object.entries(usableParsedFields(manualScrapedData)).filter(([, v]) => v !== undefined))
          : undefined,
    };

    try {
      const res = await api.onboardUser(payload, currentUser._id);
      setOnboardSuccess(res.data);
      setManualName("");
      setManualEmail("");
      setManualLinkedin("");
      setManualScrapedData(null);
      setManualEvidenceToken(null);
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
    // batch, branch and degree are optional institutional records that alumni LinkedIn data is checked against
    const csvContent = "name,email,role,linkedinUrl,batch,branch,degree,currentCompany,currentRole\n" +
      "Priya Sharma,priya.sharma@gmail.com,alumni,https://linkedin.com/in/priyasharma,2019,Computer Engineering,BE,Google,Software Engineer\n" +
      "Aarav Gupta,aarav.gupta@thapar.edu,student,,,,,,\n" +
      "Devansh Verma,devansh.verma@gmail.com,alumni,https://linkedin.com/in/devanshverma,2016,Mechanical Engineering,BE,,\n" +
      "Rhea Malhotra,rhea.malhotra@thapar.edu,student,,,,,,\n";

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
      const batchIdx = headers.indexOf("batch") !== -1 ? headers.indexOf("batch") : headers.indexOf("graduationyear");
      const branchIdx = headers.indexOf("branch") !== -1 ? headers.indexOf("branch") : headers.indexOf("department");
      const degreeIdx = headers.indexOf("degree");

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
            batch: batchIdx !== -1 && parts[batchIdx] ? parts[batchIdx] : undefined,
            branch: branchIdx !== -1 && parts[branchIdx] ? parts[branchIdx] : undefined,
            degree: degreeIdx !== -1 && parts[degreeIdx] ? parts[degreeIdx] : undefined,
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
    <div className="page-container">
      {/* Header */}
      <div className="responsive-page-header" style={{ marginBottom: "20px", borderBottom: "none", paddingBottom: 0 }}>
        <div>
          <div className="page-eyebrow"><ShieldCheck size={14} /> Administration</div>
          <h1>Admin Center</h1>
          <p>Add students and alumni, review alumni verification, and handle reported content.</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="tabs" role="tablist" aria-label="Admin sections">
        <button
          role="tab"
          aria-selected={activeTab === "onboarding"}
          onClick={() => setActiveTab("onboarding")}
          className={`tab${activeTab === "onboarding" ? " is-active" : ""}`}
        >
          <UserPlus size={16} /> Add Accounts
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "verification"}
          onClick={() => setActiveTab("verification")}
          className={`tab${activeTab === "verification" ? " is-active" : ""}`}
        >
          <CheckCircle2 size={16} /> Verification Queue
          {openVerificationCount ? <span className="chip__count">{openVerificationCount}</span> : null}
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "moderation"}
          onClick={() => setActiveTab("moderation")}
          className={`tab${activeTab === "moderation" ? " is-active" : ""}`}
        >
          <AlertTriangle size={16} /> Moderation
          {reports.length ? <span className="chip__count">{reports.length}</span> : null}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USER PROVISIONING & ONBOARDING (PRIMARY)                           */}
      {/* ========================================================================= */}
      {activeTab === "onboarding" && (
        <div>
          {/* Sub-toggle: Manual vs CSV */}
          <div className="segmented" style={{ gridTemplateColumns: "repeat(2, minmax(0, 180px))", width: "fit-content", maxWidth: "100%", marginBottom: "24px" }} role="group" aria-label="How to add accounts">
            <button
              type="button"
              onClick={() => setOnboardMode("manual")}
              className={`segmented__option${onboardMode === "manual" ? " is-selected" : ""}`}
              aria-pressed={onboardMode === "manual"}
            >
              <UserPlus size={14} /> One person
            </button>
            <button
              type="button"
              onClick={() => setOnboardMode("csv")}
              className={`segmented__option${onboardMode === "csv" ? " is-selected" : ""}`}
              aria-pressed={onboardMode === "csv"}
            >
              <UploadCloud size={14} /> CSV import
            </button>
          </div>

          <div className="responsive-split-grid">
            {/* Left Column: Form (Manual or CSV) */}
            <div className="profile-section">
              {onboardMode === "manual" ? (
                <>
                  <div style={{ marginBottom: "22px" }}>
                    <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
                      Add one account
                    </h2>
                    <p style={{ fontSize: "0.84rem", color: "#78716c", margin: "4px 0 0" }}>
                      Create an account for an alumnus or student. They get an email explaining how to sign in with Google.
                    </p>
                  </div>

                  {onboardError && (
                    <div className="alert alert-error" role="alert">
                      {onboardError}
                    </div>
                  )}

                  <form onSubmit={handleManualOnboard} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {/* Role Selector: Student vs Alumnus */}
                    <div>
                      <label className="field-label">
                        Account role
                      </label>
                      <div className="segmented" style={{ gridTemplateColumns: "1fr 1fr" }} role="group" aria-label="Account role">
                        <button
                          type="button"
                          onClick={() => setManualRole("alumni")}
                          className={`segmented__option${manualRole === "alumni" ? " is-selected" : ""}`}
                          aria-pressed={manualRole === "alumni"}
                        >
                          🎓 Alumnus
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualRole("student")}
                          className={`segmented__option${manualRole === "student" ? " is-selected" : ""}`}
                          aria-pressed={manualRole === "student"}
                        >
                          📚 Student
                        </button>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="field-label">
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
                      <label className="field-label">
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

                    {/* LinkedIn Auto-fill & PDF Upload (Alumni only) */}
                    {manualRole === "alumni" && (
                      <div style={{
                        background: "#f8fafc",
                        border: "1px solid rgba(26, 26, 26, 0.09)",
                        borderRadius: "8px",
                        padding: "14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}>
                        <input
                          type="file"
                          ref={manualPdfInputRef}
                          accept=".pdf,application/pdf"
                          style={{ display: "none" }}
                          onChange={handleManualPdfUpload}
                        />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                          <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#18181b", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Sparkles size={14} color="#0a66c2" /> Auto-Fill Alumnus from LinkedIn
                          </label>
                          <span style={{ fontSize: "0.74rem", color: "#78716c" }}>
                            Auto-populates Name, Company, Role, Batch & Skills
                          </span>
                        </div>

                        {/* Primary action: PDF Upload */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            disabled={manualPdfLoading}
                            onClick={() => manualPdfInputRef.current?.click()}
                            style={{
                              background: "#0a66c2",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "8px 14px",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              cursor: manualPdfLoading ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            {manualPdfLoading ? (
                              <><RefreshCw size={13} className="spin-animation" /> Parsing PDF...</>
                            ) : (
                              <><Upload size={13} /> Upload LinkedIn PDF</>
                            )}
                          </button>
                          <span style={{ fontSize: "0.74rem", color: "#78716c" }}>
                            From LinkedIn &rarr; More (...) &rarr; Save to PDF
                          </span>
                        </div>

                        {/* LinkedIn URL (stored on the record; not fetched) */}
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                          <input
                            className="input-control"
                            value={manualLinkedin}
                            onChange={(e) => setManualLinkedin(e.target.value)}
                            placeholder="LinkedIn profile URL (https://linkedin.com/in/...)"
                            style={{ flex: 1, fontSize: "0.82rem" }}
                          />
                        </div>

                        {manualScrapedData && (
                          <div style={{
                            marginTop: "6px",
                            padding: "10px 12px",
                            background: "rgba(10, 102, 194, 0.08)",
                            border: "1px solid rgba(10, 102, 194, 0.2)",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            color: "#0a66c2",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <CheckCircle2 size={14} color="#047857" />
                              <strong style={{ color: "#047857" }}>LinkedIn Profile Extracted Successfully</strong>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", color: "#334155" }}>
                              {(() => {
                                const f = usableParsedFields(manualScrapedData);
                                return (
                                  <>
                                    {f.name && <span>👤 <strong>{f.name}</strong></span>}
                                    {f.currentCompany && <span>🏢 <strong>{f.currentCompany}</strong></span>}
                                    {f.currentRole && <span>💼 {f.currentRole}</span>}
                                    {f.batch && <span>🎓 Batch {f.batch}</span>}
                                    {f.branch && <span>🏛️ {f.branch}</span>}
                                    {manualScrapedData.degree && <span>📜 {manualScrapedData.degree}</span>}
                                  </>
                                );
                              })()}
                            </div>
                            {manualScrapedData.skills && manualScrapedData.skills.length > 0 && (
                              <div style={{ fontSize: "0.74rem", color: "#78716c" }}>
                                ⚡ Skills: {manualScrapedData.skills.slice(0, 6).join(", ")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="alert" style={{ background: "#fbf9f4", border: "1px solid var(--border-color)", color: "#524f4a", fontSize: "0.82rem", margin: 0 }}>
                      No password is created. The person signs in with <strong>Continue with Google</strong> using this email, and the account is linked automatically.
                    </div>

                    <button
                      type="submit"
                      disabled={onboardLoading}
                      className="btn btn-primary"
                      style={{ padding: "12px", marginTop: "8px", width: "100%" }}
                    >
                      {onboardLoading ? "Creating account..." : `Create ${manualRole === "alumni" ? "Alumnus" : "Student"} Account`}
                    </button>
                  </form>
                </>
              ) : (
                /* CSV Bulk Import View */
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
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
                    <div className="alert alert-error" role="alert">
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
                    <p style={{ fontSize: "0.82rem", color: "#78716c", marginBottom: "8px" }}>
                      Required columns: <code>name,email,role</code>. Optional: <code>linkedinUrl,batch,branch,degree,currentCompany,currentRole</code>
                    </p>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(10, 102, 194, 0.08)",
                      border: "1px solid rgba(10, 102, 194, 0.2)",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      color: "#0a66c2",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      marginBottom: "16px",
                    }}>
                      <Sparkles size={13} /> LinkedIn URLs are saved, not fetched. Alumni add their details by uploading their LinkedIn PDF after their first sign-in, and batch/branch/degree are used to verify them.
                    </div>

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
                              <th style={{ padding: "8px 12px" }}>LinkedIn Profile</th>
                              <th style={{ padding: "8px 12px" }}>Batch / Branch</th>
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
                                <td style={{ padding: "8px 12px", color: "#78716c" }}>
                                  {r.linkedinUrl ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {r.linkedinUrl}
                                      </span>
                                    </div>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td style={{ padding: "8px 12px", color: "#78716c" }}>
                                  {[r.batch, r.branch, r.degree].filter(Boolean).join(" · ") || "—"}
                                </td>
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
                    <CheckCircle2 size={20} /> Account Created
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#524f4a", lineHeight: 1.4, marginBottom: "16px" }}>
                    Ask them to sign in with <strong>Continue with Google</strong> using this email:
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
                  </div>

                  <button
                    onClick={() => handleCopyCredentials(`Your Alumni Connect account is ready.\nSign in at ${typeof window !== 'undefined' ? window.location.origin : ''}/login with "Continue with Google" using ${onboardSuccess.user.email}.`)}
                    className="btn btn-secondary btn-sm"
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    {copied ? <><Check size={14} color="#047857" /> Copied to Clipboard!</> : <><Copy size={14} /> Copy sign-in instructions</>}
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
                    <div>&bull; They sign in with <strong>Continue with Google</strong> using their email</div>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#78716c" }}>
                    No passwords were created, so nobody can sign in to these accounts without access to the email's Google account.
                  </div>
                </div>
              ) : (
                <div className="profile-section" style={{
                }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#18181b", marginBottom: "8px" }}>
                    How accounts work
                  </h4>
                  <p style={{ fontSize: "0.82rem", color: "#524f4a", lineHeight: 1.5, margin: 0 }}>
                    Everyone signs in with Google, which proves the email is theirs. Accounts you create here have no password; the person signs in with Google using that email and is linked to this record automatically. Students can also join on their own with an @thapar.edu Google account, and alumni with any Google account (they start as Not verified).
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
                          <span className={`badge ${(VERIFICATION_STATUS[getVerificationStatus(u)] || VERIFICATION_STATUS.pending).badge}`}>
                            {(VERIFICATION_STATUS[getVerificationStatus(u)] || VERIFICATION_STATUS.pending).label}
                          </span>
                        ) : (
                          <span style={{ color: "#a8a29e", fontSize: "0.82rem" }}>
                            {u.role === "admin" ? "Administrator" : "—"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        {u.role !== "admin" && !u.isAdmin ? (
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
        <VerificationDashboard onDeleteUser={handleDeleteUser} onCountsChange={handleVerificationCounts} />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONTENT MODERATION QUEUE                                           */}
      {/* ========================================================================= */}
      {activeTab === "moderation" && (
        <div className="profile-section" style={{
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
