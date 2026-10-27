import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Avatar } from "./Avatar";
import {
  User,
  Lock,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  FileText,
  Check,
  Globe,
  Eye,
} from "lucide-react";

export const ProfileView = ({ currentUser, onUserUpdated }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const pdfFileInputRef = useRef(null);

  // General Profile State
  const [name, setName] = useState(currentUser?.name || "");
  const [profilePicture, setProfilePicture] = useState(currentUser?.profilePicture || "");
  const [branch, setBranch] = useState(currentUser?.branch || "Computer Engineering");
  const [batch, setBatch] = useState(currentUser?.batch || 2026);
  const [skills, setSkills] = useState(
    Array.isArray(currentUser?.skills) ? currentUser.skills.join(", ") : ""
  );
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [githubUrl, setGithubUrl] = useState(currentUser?.githubUrl || "");

  // Student Fields
  const [careerGoal, setCareerGoal] = useState(currentUser?.careerGoal || "");
  const [resumeUrl, setResumeUrl] = useState(currentUser?.resumeUrl || "");

  // Alumni Fields
  const [currentCompany, setCurrentCompany] = useState(currentUser?.currentCompany || "");
  const [currentRole, setCurrentRole] = useState(currentUser?.currentRole || "");
  const [industry, setIndustry] = useState(currentUser?.industry || "Technology");
  const [areasOfExpertise, setAreasOfExpertise] = useState(
    Array.isArray(currentUser?.areasOfExpertise) ? currentUser.areasOfExpertise.join(", ") : ""
  );
  const [linkedinUrl, setLinkedinUrl] = useState(currentUser?.linkedinUrl || "");
  const [availableForMentorshipCalls, setAvailableForMentorshipCalls] = useState(
    Boolean(currentUser?.availableForMentorshipCalls)
  );
  const [willingToRefer, setWillingToRefer] = useState(
    Boolean(currentUser?.willingToRefer)
  );
  const [experience, setExperience] = useState(currentUser?.experience || []);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Profile Save State
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // LinkedIn Scraper & PDF State (Alumni only)
  const [pdfLoading, setPdfLoading] = useState(false);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState(null);
  const [scrapeError, setScrapeError] = useState(null);
  const [showRawTextInput, setShowRawTextInput] = useState(false);
  const [showUrlOption, setShowUrlOption] = useState(false);
  const [rawHeadlineText, setRawHeadlineText] = useState("");
  const [scrapedPreview, setScrapedPreview] = useState(null);

  // Handle Official LinkedIn PDF Upload (Save to PDF)
  const handlePdfUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setScrapeError("Please select a valid PDF file exported from LinkedIn.");
      return;
    }

    setPdfLoading(true);
    setScrapeError(null);
    setScrapeMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target?.result;
        const res = await api.parseLinkedInPdf(base64Data, null, currentUser?._id);
        if (res?.data) {
          const d = res.data;
          if (d.name && !name) setName(d.name);
          if (d.currentCompany) setCurrentCompany(d.currentCompany);
          if (d.currentRole) setCurrentRole(d.currentRole);
          if (d.branch) setBranch(d.branch);
          if (d.batch) setBatch(d.batch);
          if (d.industry) setIndustry(d.industry);
          if (d.linkedinUrl && !linkedinUrl) setLinkedinUrl(d.linkedinUrl);
          if (d.skills && d.skills.length > 0) {
            const currentList = skills.split(",").map((s) => s.trim()).filter(Boolean);
            const combined = Array.from(new Set([...currentList, ...d.skills]));
            setSkills(combined.join(", "));
          }
          if (d.areasOfExpertise && d.areasOfExpertise.length > 0) {
            const currentExp = areasOfExpertise.split(",").map((s) => s.trim()).filter(Boolean);
            const combined = Array.from(new Set([...currentExp, ...d.areasOfExpertise]));
            setAreasOfExpertise(combined.join(", "));
          }
          if (d.bio && (!bio || bio.length < 25)) {
            setBio(d.bio);
          }
          setScrapedPreview(d);
          setScrapeMessage(
            `LinkedIn PDF for ${d.name || "Alumnus"} parsed successfully! Company (${d.currentCompany}), Role (${d.currentRole}), Batch (${d.batch}), and Skills have been auto-populated.`
          );
        }
      } catch (err) {
        setScrapeError(err.message || "Failed to parse LinkedIn PDF file.");
      } finally {
        setPdfLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleScrapeLinkedIn = async (customText = null) => {
    const urlToScrape = linkedinUrl.trim();
    const textToScrape = customText !== null ? customText.trim() : rawHeadlineText.trim();

    if (!urlToScrape && !textToScrape) {
      setScrapeError("Please enter a LinkedIn profile URL or paste your profile summary/headline.");
      return;
    }

    setScrapeLoading(true);
    setScrapeError(null);
    setScrapeMessage(null);

    try {
      const res = await api.scrapeLinkedInProfile(urlToScrape, textToScrape, currentUser?._id);
      if (res?.data) {
        const d = res.data;
        if (d.name && !name) setName(d.name);
        if (d.currentCompany) setCurrentCompany(d.currentCompany);
        if (d.currentRole) setCurrentRole(d.currentRole);
        if (d.industry) setIndustry(d.industry);
        if (d.skills && d.skills.length > 0) {
          const currentSkillsList = skills.split(",").map((s) => s.trim()).filter(Boolean);
          const combined = Array.from(new Set([...currentSkillsList, ...d.skills]));
          setSkills(combined.join(", "));
        }
        if (d.areasOfExpertise && d.areasOfExpertise.length > 0) {
          const currentExpList = areasOfExpertise.split(",").map((s) => s.trim()).filter(Boolean);
          const combined = Array.from(new Set([...currentExpList, ...d.areasOfExpertise]));
          setAreasOfExpertise(combined.join(", "));
        }
        if (d.bio && (!bio || bio.length < 25)) {
          setBio(d.bio);
        }
        if (d.profilePicture && (!profilePicture || profilePicture.startsWith("http"))) {
          setProfilePicture(d.profilePicture);
        }
        if (d.linkedinUrl && !linkedinUrl) {
          setLinkedinUrl(d.linkedinUrl);
        }

        setScrapedPreview(d);
        setScrapeMessage(
          res.source === "text_parse" || res.source === "text_fallback"
            ? "Profile fields auto-filled from headline/bio text!"
            : "LinkedIn profile extracted and auto-filled! Review the fields below and click 'Save Changes'."
        );
      }
    } catch (err) {
      setScrapeError(err.message || "Unable to reach LinkedIn profile directly. You can paste your profile headline/about below to auto-fill.");
      setShowRawTextInput(true);
    } finally {
      setScrapeLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setProfilePicture(currentUser.profilePicture || "");
      setBranch(currentUser.branch || "Computer Engineering");
      setBatch(currentUser.batch || 2026);
      setSkills(Array.isArray(currentUser.skills) ? currentUser.skills.join(", ") : "");
      setBio(currentUser.bio || "");
      setGithubUrl(currentUser.githubUrl || "");
      setCareerGoal(currentUser.careerGoal || "");
      setResumeUrl(currentUser.resumeUrl || "");
      setCurrentCompany(currentUser.currentCompany || "");
      setCurrentRole(currentUser.currentRole || "");
      setIndustry(currentUser.industry || "Technology");
      setAreasOfExpertise(
        Array.isArray(currentUser.areasOfExpertise) ? currentUser.areasOfExpertise.join(", ") : ""
      );
      setLinkedinUrl(currentUser.linkedinUrl || "");
      setAvailableForMentorshipCalls(Boolean(currentUser.availableForMentorshipCalls));
      setWillingToRefer(Boolean(currentUser.willingToRefer));
    }
  }, [currentUser]);

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setProfilePicture(compressedDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser?._id) return;

    setProfileLoading(true);
    setProfileMessage(null);
    setProfileError(null);

    const updates = {
      name: name.trim(),
      profilePicture: profilePicture.trim(),
      branch: branch.trim(),
      batch: Number(batch) || undefined,
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      bio: bio.trim(),
      githubUrl: githubUrl.trim(),
    };

    if (currentUser.role === "student") {
      updates.careerGoal = careerGoal.trim();
      updates.resumeUrl = resumeUrl.trim();
    }

    if (currentUser.role === "alumni") {
      updates.currentCompany = currentCompany.trim();
      updates.currentRole = currentRole.trim();
      updates.industry = industry.trim();
      updates.areasOfExpertise = areasOfExpertise.split(",").map((s) => s.trim()).filter(Boolean);
      updates.linkedinUrl = linkedinUrl.trim();
      updates.availableForMentorshipCalls = Boolean(availableForMentorshipCalls);
      updates.willingToRefer = Boolean(willingToRefer);
    }

    try {
      const res = await api.updateUserProfile(currentUser._id, updates, currentUser._id);
      setProfileMessage("Profile details updated successfully!");
      if (onUserUpdated && res.data) {
        onUserUpdated(res.data);
      }
    } catch (err) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentUser?._id) return;

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);
    setPasswordError(null);

    try {
      await api.changePassword(currentUser._id, currentPassword, newPassword);
      setPasswordMessage("Password changed successfully! Please use your new password next time you sign in.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message || "Failed to change password. Please verify your current password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" }}>
      {/* Header Banner */}
      <div style={{
        background: "#ffffff",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-lg)",
        padding: "28px 32px",
        marginBottom: "28px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* User Avatar */}
          <Avatar
            user={{ name, role: currentUser?.role, profilePicture }}
            size={68}
            style={{ boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)" }}
          />

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#18181b", margin: 0 }}>
                {currentUser?.name}
              </h1>
              <span className={`badge badge-${currentUser?.role === "student" ? "cyan" : currentUser?.role === "admin" ? "emerald" : "amber"}`}>
                {currentUser?.role}
              </span>
              {currentUser?.role === "alumni" && currentUser?.isVerified && (
                <span className="badge badge-emerald">
                  <ShieldCheck size={12} /> Verified Alumnus
                </span>
              )}
            </div>

            <p style={{ fontSize: "0.88rem", color: "#78716c", margin: 0 }}>
              Institutional Account: <strong>{currentUser?.email}</strong>
            </p>
          </div>
        </div>

        <div style={{ fontSize: "0.82rem", color: "#524f4a", background: "#fbf9f4", padding: "10px 16px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(0, 0, 0, 0.08)" }}>
          Provisioned by <strong>Thapar Placement & Alumni Cell</strong>
        </div>
      </div>

      <div className="responsive-split-grid">
        {/* ========================================================================= */}
        {/* Left Column: Complete Profile Details Form                                */}
        {/* ========================================================================= */}
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "32px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
            <User size={22} color="#18181b" />
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#18181b", margin: 0 }}>
                Complete Your Profile
              </h2>
              <span style={{ fontSize: "0.82rem", color: "#78716c" }}>
                Keep your details up to date for networking, directory visibility, and mentorship
              </span>
            </div>
          </div>

          {profileMessage && (
            <div style={{ padding: "12px 16px", background: "rgba(4, 120, 87, 0.08)", border: "1px solid rgba(4, 120, 87, 0.25)", borderRadius: "8px", color: "#047857", fontSize: "0.86rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={18} /> {profileMessage}
            </div>
          )}

          {profileError && (
            <div style={{ padding: "12px 16px", background: "rgba(190, 18, 60, 0.08)", border: "1px solid rgba(190, 18, 60, 0.25)", borderRadius: "8px", color: "#be123c", fontSize: "0.86rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={18} /> {profileError}
            </div>
          )}

          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Profile Picture Upload & Preview Card */}
            <div style={{
              background: "#fbf9f4",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: "var(--radius-md)",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: "0.86rem", fontWeight: 700, color: "#18181b", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Camera size={16} color="#92400e" /> Profile Picture
                </label>
                <span style={{ fontSize: "0.75rem", color: "#78716c" }}>
                  Visible in Alumni Directory & platform
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <Avatar
                  user={{ name, role: currentUser?.role, profilePicture }}
                  size={64}
                  borderRadius="16px"
                />

                <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    type="url"
                    className="input-control"
                    value={profilePicture}
                    onChange={(e) => setProfilePicture(e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    style={{ fontSize: "0.84rem", padding: "8px 12px" }}
                  />

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.78rem", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <Upload size={13} /> Upload Image File
                    </button>

                    {profilePicture && (
                      <button
                        type="button"
                        onClick={() => setProfilePicture("")}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#be123c",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 8px",
                        }}
                      >
                        <Trash2 size={13} /> Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Full Name & Institutional Email */}
            <div className="responsive-form-grid-2">
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Full Name
                </label>
                <input
                  required
                  className="input-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Email Address (Fixed)
                </label>
                <input
                  disabled
                  className="input-control"
                  value={currentUser?.email || ""}
                  style={{ background: "#f3efe6", opacity: 0.8, cursor: "not-allowed" }}
                />
              </div>
            </div>

            {/* Branch & Batch */}
            <div className="responsive-form-grid-2">
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Branch / Department
                </label>
                <input
                  className="input-control"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Engineering"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Batch / Year
                </label>
                <input
                  type="number"
                  className="input-control"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="e.g. 2026"
                />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Skills & Technologies (comma separated)
              </label>
              <input
                className="input-control"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. React, Node.js, Python, AWS, Docker, Machine Learning"
              />
            </div>

            {/* Bio */}
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Bio / Summary
              </label>
              <textarea
                className="textarea-control"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A brief intro about yourself and your academic or professional journey..."
                style={{ minHeight: "80px" }}
              />
            </div>

            {/* Student-Specific Fields */}
            {currentUser?.role === "student" && (
              <div style={{ background: "#fbf9f4", padding: "18px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(0, 0, 0, 0.08)", display: "flex", flexDirection: "column", gap: "14px" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#18181b", display: "flex", alignItems: "center", gap: "8px" }}>
                  <GraduationCap size={18} color="#0284c7" /> Student Career Preferences
                </h4>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                    Career Aspirations & Target Roles
                  </label>
                  <input
                    className="input-control"
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    placeholder="e.g. Aspiring Software Engineer focusing on distributed systems"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                    Resume URL (Drive link or RecruitSage profile)
                  </label>
                  <input
                    className="input-control"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://recruitsage.com/profile or Drive Link"
                  />
                </div>
              </div>
            )}

            {/* Alumni-Specific Fields */}
            {currentUser?.role === "alumni" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* LinkedIn Auto-Fill Card (PDF Upload Primary) */}
                <div style={{
                  background: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
                  borderRadius: "var(--radius-md)",
                  padding: "22px 24px",
                  color: "#ffffff",
                  boxShadow: "0 8px 24px rgba(10, 102, 194, 0.25)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}>
                  {/* Hidden PDF File Input */}
                  <input
                    type="file"
                    ref={pdfFileInputRef}
                    accept=".pdf,application/pdf"
                    style={{ display: "none" }}
                    onChange={handlePdfUpload}
                  />

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.35rem",
                        fontWeight: 900,
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                      }}>
                        in
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Sparkles size={18} color="#fde047" /> Auto-Fill Profile from LinkedIn
                        </h4>
                        <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "rgba(255, 255, 255, 0.88)" }}>
                          Upload your official LinkedIn Profile PDF to automatically extract role, company, batch, branch, skills, and bio.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowUrlOption(!showUrlOption)}
                      style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: "6px",
                        color: "#ffffff",
                        padding: "6px 12px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Globe size={13} /> {showUrlOption ? "Hide URL Option" : "Or use Public Link / Text"}
                    </button>
                  </div>

                  {/* Primary Feature: PDF Upload Zone */}
                  <div style={{
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1.5px dashed rgba(255, 255, 255, 0.45)",
                    borderRadius: "10px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: "12px",
                    backdropFilter: "blur(6px)",
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(253, 224, 71, 0.2)",
                        border: "1px solid rgba(253, 224, 71, 0.4)",
                        color: "#fef08a",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}>
                        <Sparkles size={12} /> Recommended & 100% Accurate
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "0.84rem", color: "rgba(255, 255, 255, 0.95)", maxWidth: "560px", lineHeight: 1.5 }}>
                        On your LinkedIn profile page, click <strong>"More" (...)</strong> below your picture &rarr; select <strong>"Save to PDF"</strong> &rarr; upload the downloaded PDF file here.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={pdfLoading}
                      onClick={() => pdfFileInputRef.current?.click()}
                      style={{
                        padding: "12px 26px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#ffffff",
                        color: "#0a66c2",
                        fontWeight: 800,
                        fontSize: "0.92rem",
                        cursor: pdfLoading ? "not-allowed" : "pointer",
                        opacity: pdfLoading ? 0.8 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                      onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    >
                      {pdfLoading ? (
                        <>
                          <RefreshCw size={17} className="spin-animation" /> Parsing LinkedIn PDF...
                        </>
                      ) : (
                        <>
                          <Upload size={17} /> Upload LinkedIn Profile PDF
                        </>
                      )}
                    </button>
                    <span style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.75)" }}>
                      Accepts standard LinkedIn "Save to PDF" export (.pdf)
                    </span>
                  </div>

                  {/* Secondary / Fallback: Public URL & Text Paste Drawer */}
                  {showUrlOption && (
                    <div style={{
                      background: "rgba(0, 0, 0, 0.18)",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      borderRadius: "8px",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      animation: "fadeIn 0.2s ease-in-out",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ffffff" }}>
                          Alternative: Scrape Public Link or Paste Summary
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowRawTextInput(!showRawTextInput)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          {showRawTextInput ? "Hide Text Paste" : "Paste Headline / Bio Text"}
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <input
                          type="url"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          placeholder="https://www.linkedin.com/in/your-username"
                          style={{
                            flex: 1,
                            minWidth: "240px",
                            padding: "9px 13px",
                            borderRadius: "6px",
                            border: "1px solid rgba(255, 255, 255, 0.3)",
                            background: "#ffffff",
                            color: "#18181b",
                            fontSize: "0.86rem",
                            outline: "none",
                          }}
                        />

                        <button
                          type="button"
                          disabled={scrapeLoading || !linkedinUrl.trim()}
                          onClick={() => handleScrapeLinkedIn()}
                          style={{
                            padding: "9px 16px",
                            borderRadius: "6px",
                            border: "none",
                            background: "#ffffff",
                            color: "#0a66c2",
                            fontWeight: 700,
                            fontSize: "0.84rem",
                            cursor: scrapeLoading || !linkedinUrl.trim() ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {scrapeLoading ? (
                            <>
                              <RefreshCw size={14} className="spin-animation" /> Fetching...
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} /> Fetch URL
                            </>
                          )}
                        </button>
                      </div>

                      {showRawTextInput && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                          <textarea
                            rows={3}
                            value={rawHeadlineText}
                            onChange={(e) => setRawHeadlineText(e.target.value)}
                            placeholder="Paste your LinkedIn headline or About summary..."
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              borderRadius: "6px",
                              border: "none",
                              fontSize: "0.82rem",
                              color: "#18181b",
                              background: "#ffffff",
                              resize: "vertical",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                          <button
                            type="button"
                            disabled={scrapeLoading || !rawHeadlineText.trim()}
                            onClick={() => handleScrapeLinkedIn(rawHeadlineText)}
                            style={{
                              alignSelf: "flex-end",
                              padding: "7px 14px",
                              borderRadius: "6px",
                              background: "#ffffff",
                              color: "#0a66c2",
                              border: "none",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              cursor: scrapeLoading || !rawHeadlineText.trim() ? "not-allowed" : "pointer",
                            }}
                          >
                            Parse Text
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scrape Feedback Alerts */}
                  {scrapeMessage && (
                    <div style={{
                      background: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      color: "#047857",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}>
                      <CheckCircle2 size={16} /> {scrapeMessage}
                    </div>
                  )}

                  {scrapeError && (
                    <div style={{
                      background: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      color: "#b91c1c",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}>
                      <AlertCircle size={16} /> {scrapeError}
                    </div>
                  )}

                  {/* Scraped Preview Pills */}
                  {scrapedPreview && (
                    <div style={{
                      background: "rgba(255, 255, 255, 0.12)",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      fontSize: "0.78rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                        <span style={{ fontWeight: 700, color: "#ffffff" }}>
                          Extracted Professional Summary:
                        </span>
                        <span style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.72rem" }}>
                          Applied to the fields below
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        {scrapedPreview.name && (
                          <span style={{ background: "rgba(255, 255, 255, 0.2)", padding: "3px 8px", borderRadius: "4px" }}>
                            👤 <strong>Name:</strong> {scrapedPreview.name}
                          </span>
                        )}
                        {scrapedPreview.currentCompany && (
                          <span style={{ background: "rgba(255, 255, 255, 0.2)", padding: "3px 8px", borderRadius: "4px" }}>
                            🏢 <strong>Company:</strong> {scrapedPreview.currentCompany}
                          </span>
                        )}
                        {scrapedPreview.currentRole && (
                          <span style={{ background: "rgba(255, 255, 255, 0.2)", padding: "3px 8px", borderRadius: "4px" }}>
                            💼 <strong>Role:</strong> {scrapedPreview.currentRole}
                          </span>
                        )}
                        {scrapedPreview.batch && (
                          <span style={{ background: "rgba(255, 255, 255, 0.2)", padding: "3px 8px", borderRadius: "4px" }}>
                            🎓 <strong>Batch:</strong> {scrapedPreview.batch}
                          </span>
                        )}
                        {scrapedPreview.industry && (
                          <span style={{ background: "rgba(255, 255, 255, 0.2)", padding: "3px 8px", borderRadius: "4px" }}>
                            🌐 <strong>Industry:</strong> {scrapedPreview.industry}
                          </span>
                        )}
                      </div>
                      {scrapedPreview.skills && scrapedPreview.skills.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                          <span style={{ color: "rgba(255, 255, 255, 0.9)" }}>⚡ Skills:</span>
                          {scrapedPreview.skills.map((s, idx) => (
                            <span key={idx} style={{ background: "rgba(255, 255, 255, 0.25)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ background: "#fbf9f4", padding: "18px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(0, 0, 0, 0.08)", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#18181b", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Briefcase size={18} color="#92400e" /> Alumni Professional Profile
                  </h4>

                <div className="responsive-form-grid-2">
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                      Current Company
                    </label>
                    <input
                      className="input-control"
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      placeholder="e.g. Google, Microsoft, Amazon"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                      Current Role / Title
                    </label>
                    <input
                      className="input-control"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>
                </div>

                <div className="responsive-form-grid-2">
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                      Industry
                    </label>
                    <input
                      className="input-control"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. Technology, Fintech, Automotive"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                      LinkedIn Profile URL
                    </label>
                    <input
                      className="input-control"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                    Areas of Expertise (comma separated)
                  </label>
                  <input
                    className="input-control"
                    value={areasOfExpertise}
                    onChange={(e) => setAreasOfExpertise(e.target.value)}
                    placeholder="e.g. System Design, Cloud Architecture, Interview Prep"
                  />
                </div>

                <div style={{ display: "flex", gap: "24px", marginTop: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer", color: "#18181b" }}>
                    <input
                      type="checkbox"
                      checked={availableForMentorshipCalls}
                      onChange={(e) => setAvailableForMentorshipCalls(e.target.checked)}
                    />
                    Available for 1-on-1 Mentorship
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer", color: "#18181b" }}>
                    <input
                      type="checkbox"
                      checked={willingToRefer}
                      onChange={(e) => setWillingToRefer(e.target.checked)}
                    />
                    Open to Giving Job Referrals
                  </label>
                </div>
              </div>
            </div>
          )}

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                GitHub Profile URL (Optional)
              </label>
              <input
                className="input-control"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="btn btn-primary"
              style={{ alignSelf: "flex-start", padding: "10px 24px" }}
            >
              <Save size={16} /> {profileLoading ? "Saving Profile..." : "Save Profile Details"}
            </button>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* Right Column: Change Password Card                                       */}
        {/* ========================================================================= */}
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "32px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <KeyRound size={22} color="#92400e" />
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#18181b", margin: 0 }}>
                Change Password
              </h3>
              <span style={{ fontSize: "0.78rem", color: "#78716c" }}>
                Update your default credentials
              </span>
            </div>
          </div>

          <p style={{ fontSize: "0.82rem", color: "#524f4a", lineHeight: 1.5, marginBottom: "20px" }}>
            If you are currently signed in with the default password assigned by the Administrator, please create a new private password below.
          </p>

          {passwordMessage && (
            <div style={{ padding: "12px", background: "rgba(4, 120, 87, 0.08)", border: "1px solid rgba(4, 120, 87, 0.25)", borderRadius: "8px", color: "#047857", fontSize: "0.82rem", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>{passwordMessage}</div>
            </div>
          )}

          {passwordError && (
            <div style={{ padding: "12px", background: "rgba(190, 18, 60, 0.08)", border: "1px solid rgba(190, 18, 60, 0.25)", borderRadius: "8px", color: "#be123c", fontSize: "0.82rem", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>{passwordError}</div>
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Current Password
              </label>
              <input
                type="password"
                required
                className="input-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                New Password (min 6 chars)
              </label>
              <input
                type="password"
                required
                className="input-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Confirm New Password
              </label>
              <input
                type="password"
                required
                className="input-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="btn btn-primary"
              style={{ width: "100%", padding: "10px", marginTop: "4px" }}
            >
              {passwordLoading ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
