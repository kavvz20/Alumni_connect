import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

export const ProfileView = ({ currentUser, onUserUpdated }) => {
  const fileInputRef = useRef(null);

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

    if (file.size > 3 * 1024 * 1024) {
      alert("Image size should be under 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setProfilePicture(event.target?.result || "");
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
