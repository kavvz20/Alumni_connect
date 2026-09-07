import React, { useState } from "react";
import { api } from "../services/api";
import {
  X,
  LogIn,
  UserPlus,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  GraduationCap,
} from "lucide-react";

export const AuthModal = ({ isOpen, onClose, onAuthSuccess, existingUsers = [] }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [branch, setBranch] = useState("Computer Engineering");
  const [batch, setBatch] = useState(2026);
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");

  // Student specific
  const [careerGoal, setCareerGoal] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  // Alumni specific
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [areasOfExpertise, setAreasOfExpertise] = useState("");
  const [availableForMentorshipCalls, setAvailableForMentorshipCalls] = useState(true);
  const [willingToRefer, setWillingToRefer] = useState(true);
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Handle Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email.trim(), password);
      onAuthSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to sign in. Check your email or password.");
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click persona sign-in
  const handleQuickSignIn = (user) => {
    onAuthSuccess(user);
    onClose();
  };

  // Handle Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !signupPassword) {
      setError("Name, Email, and Create Password are required.");
      return;
    }

    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify your confirm password.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      role,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: signupPassword.trim(),
      branch: branch.trim(),
      batch: Number(batch) || 2026,
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      bio: bio.trim(),
    };

    if (role === "student") {
      payload.careerGoal = careerGoal.trim();
      payload.resumeUrl = resumeUrl.trim();
    } else if (role === "alumni") {
      payload.currentCompany = currentCompany.trim();
      payload.currentRole = currentRole.trim();
      payload.industry = industry.trim();
      payload.areasOfExpertise = areasOfExpertise.split(",").map((s) => s.trim()).filter(Boolean);
      payload.availableForMentorshipCalls = availableForMentorshipCalls;
      payload.willingToRefer = willingToRefer;
      payload.linkedinUrl = linkedinUrl.trim();
      payload.isVerified = false; // Pending admin verification
    }

    try {
      const res = await api.createUser(payload);
      alert("Account created successfully!");
      onAuthSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create user profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: "560px", padding: "32px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
              {isSignUp ? "Create Alumni Connect Profile" : "Sign In to Alumni Connect"}
            </h2>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {isSignUp
                ? "Join the Thapar student and alumni mentorship ecosystem"
                : "Choose a quick persona or enter your email to access your account"}
            </div>
          </div>

          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={22} />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div style={{
          display: "flex",
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "var(--radius-sm)",
          padding: "4px",
          marginBottom: "24px",
        }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            style={{
              flex: 1,
              padding: "9px",
              borderRadius: "6px",
              border: "none",
              background: !isSignUp ? "var(--accent-primary)" : "transparent",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <LogIn size={15} /> Sign In / Switch Persona
          </button>

          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            style={{
              flex: 1,
              padding: "9px",
              borderRadius: "6px",
              border: "none",
              background: isSignUp ? "var(--accent-primary)" : "transparent",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <UserPlus size={15} /> Register New User
          </button>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "8px", color: "#fda4af", fontSize: "0.85rem", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {!isSignUp ? (
          /* SIGN IN FORM */
          <div>
            {/* Email Sign In Form */}
            <form onSubmit={handleSignIn}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Registered Email Address
                </label>
                <input
                  type="email"
                  className="input-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@thapar.edu"
                  required
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Password
                </label>
                <input
                  type="password"
                  className="input-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", marginTop: "6px" }}>
                  Default password for seeded accounts: <code>password123</code>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="btn btn-primary"
                style={{ width: "100%", padding: "12px" }}
              >
                {loading ? "Signing in..." : "Sign In to Account"}
              </button>
            </form>
          </div>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSignUp} style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "4px" }}>
            {/* Role Selection */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                I AM REGISTERING AS A:
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    border: role === "student" ? "2px solid var(--accent-primary)" : "1px solid var(--border-color)",
                    background: role === "student" ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.04)",
                    color: role === "student" ? "#fff" : "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <GraduationCap size={18} /> Student
                </button>

                <button
                  type="button"
                  onClick={() => setRole("alumni")}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    border: role === "alumni" ? "2px solid var(--accent-amber)" : "1px solid var(--border-color)",
                    background: role === "alumni" ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.04)",
                    color: role === "alumni" ? "#fbbf24" : "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Briefcase size={18} /> Alumnus / Mentor
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Full Name</label>
                <input
                  className="input-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kavya Thukral"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Email Address</label>
                <input
                  type="email"
                  className="input-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@thapar.edu"
                  required
                />
              </div>
            </div>

            {/* Create Password & Confirm Password */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Create Password</label>
                <input
                  type="password"
                  className="input-control"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Confirm Password</label>
                <input
                  type="password"
                  className="input-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Branch</label>
                <select className="select-control" value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Electronics & Communication">Electronics & Comm.</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                  {role === "student" ? "Expected Graduation Year" : "Graduation Batch"}
                </label>
                <input
                  type="number"
                  className="input-control"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="2026"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Skills (comma separated)</label>
              <input
                className="input-control"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. React, Node.js, Python, AWS"
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Short Bio</label>
              <textarea
                className="textarea-control"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief introduction about yourself..."
                style={{ minHeight: "65px" }}
              />
            </div>

            {/* Student Specific */}
            {role === "student" && (
              <>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Career Goal (used by AI Mentor Matching)
                  </label>
                  <textarea
                    className="textarea-control"
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    placeholder="e.g. I want to crack SDE-1 interviews at top tech product companies."
                    style={{ minHeight: "75px" }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Verified Resume Link (RecruitSage / Drive)
                  </label>
                  <input
                    type="url"
                    className="input-control"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://recruitsage.thapar.edu/resumes/..."
                  />
                </div>
              </>
            )}

            {/* Alumni Specific */}
            {role === "alumni" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Current Company</label>
                    <input
                      className="input-control"
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      placeholder="e.g. Google, Microsoft"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Current Role</label>
                    <input
                      className="input-control"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      placeholder="e.g. Software Engineer III"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Industry</label>
                    <input
                      className="input-control"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. Technology"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Areas of Expertise</label>
                    <input
                      className="input-control"
                      value={areasOfExpertise}
                      onChange={(e) => setAreasOfExpertise(e.target.value)}
                      placeholder="e.g. Distributed Systems, SDE Prep"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>LinkedIn Profile URL</label>
                  <input
                    type="url"
                    className="input-control"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>

                {/* Mentorship & Referral Toggles */}
                <div style={{
                  padding: "14px",
                  background: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "20px",
                }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={availableForMentorshipCalls}
                      onChange={(e) => setAvailableForMentorshipCalls(e.target.checked)}
                    />
                    <span>Available for 1-on-1 Mentorship Calls</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={willingToRefer}
                      onChange={(e) => setWillingToRefer(e.target.checked)}
                    />
                    <span>Willing to give internal job/internship referrals</span>
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-amber"
              style={{ width: "100%", padding: "12px", marginTop: "10px" }}
            >
              {loading ? "Creating Profile..." : "Complete Registration & Sign In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
