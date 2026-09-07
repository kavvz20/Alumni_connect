import React, { useState } from "react";
import { api } from "../services/api";
import {
  Sparkles,
  Briefcase,
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";

export const AuthView = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle Institutional Email / Password Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Both email address and password are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email.trim(), password);
      onAuthSuccess(res.data);
    } catch (err) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 140px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{
        maxWidth: "1080px",
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
        gap: "36px",
        alignItems: "center",
      }}>
        {/* ========================================================================= */}
        {/* Left Side: Product Branding & Institutional Pillars                      */}
        {/* ========================================================================= */}
        <div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            background: "rgba(180, 83, 9, 0.08)",
            border: "1px solid rgba(180, 83, 9, 0.2)",
            borderRadius: "var(--radius-full)",
            color: "#92400e",
            fontSize: "0.82rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "16px",
          }}>
            <Sparkles size={16} /> Thapar Alumni Ecosystem
          </div>

          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: "16px",
            color: "#18181b",
          }}>
            Bridging Students with Alumni
          </h1>

          <p style={{ fontSize: "1rem", color: "#524f4a", lineHeight: 1.6, marginBottom: "28px" }}>
            An official, institution-managed ecosystem for 1-on-1 career mentorship, internal job referrals, peer forums, and verified alumni networking.
          </p>

          {/* 3 Core Pillars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "rgba(24, 24, 27, 0.05)",
                border: "1px solid rgba(24, 24, 27, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#18181b",
                flexShrink: 0,
              }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: "1.02rem", fontWeight: 700, color: "#18181b" }}>Admin-Provisioned Accounts</h4>
                <p style={{ fontSize: "0.85rem", color: "#78716c" }}>
                  All accounts are verified and provisioned directly by the university administration to guarantee authentic identities.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "rgba(180, 83, 9, 0.08)",
                border: "1px solid rgba(180, 83, 9, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#92400e",
                flexShrink: 0,
              }}>
                <Briefcase size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: "1.02rem", fontWeight: 700, color: "#18181b" }}>Internal Job & Internship Referrals</h4>
                <p style={{ fontSize: "0.85rem", color: "#78716c" }}>
                  Request direct company referrals from verified alumni across top global engineering and product firms.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "rgba(4, 120, 87, 0.08)",
                border: "1px solid rgba(4, 120, 87, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#047857",
                flexShrink: 0,
              }}>
                <User size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: "1.02rem", fontWeight: 700, color: "#18181b" }}>1-on-1 Mentorship Sessions</h4>
                <p style={{ fontSize: "0.85rem", color: "#78716c" }}>
                  Direct scheduling with automated Google Meet links on confirmed mentorship requests.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Right Side: Institutional Sign In Form                                   */}
        {/* ========================================================================= */}
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "36px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.06)",
        }}>
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#18181b", marginBottom: "6px" }}>
              Sign In
            </h2>
            <p style={{ fontSize: "0.88rem", color: "#78716c" }}>
              Enter your institutional credentials provided by the Administrator.
            </p>
          </div>

          {error && (
            <div style={{
              padding: "12px 16px",
              background: "rgba(190, 18, 60, 0.08)",
              border: "1px solid rgba(190, 18, 60, 0.25)",
              borderRadius: "8px",
              color: "#be123c",
              fontSize: "0.86rem",
              marginBottom: "20px",
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Institutional Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={17} style={{ position: "absolute", left: "14px", top: "13px", color: "#8c857b" }} />
                <input
                  type="email"
                  required
                  className="input-control"
                  style={{ paddingLeft: "42px" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rollno@thapar.edu or alumni@alumni.thapar.edu"
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>
                  Password
                </label>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={17} style={{ position: "absolute", left: "14px", top: "13px", color: "#8c857b" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-control"
                  style={{ paddingLeft: "42px", paddingRight: "42px" }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "10px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#8c857b",
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "0.95rem",
              }}
            >
              {loading ? "Verifying Credentials..." : (
                <>Sign In to Portal <ArrowRight size={17} /></>
              )}
            </button>
          </form>

          {/* Institutional Provisioning Notice Box */}
          <div style={{
            marginTop: "26px",
            padding: "16px",
            background: "#fbf9f4",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}>
            <Info size={20} color="#92400e" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "0.82rem", color: "#524f4a", lineHeight: 1.5 }}>
              <strong style={{ color: "#18181b", display: "block", marginBottom: "4px" }}>
                Account Provisioning Notice:
              </strong>
              Student and alumni accounts are created and provisioned directly by the <strong>Placement & Alumni Relations Cell</strong>.
              Check your registered email inbox for your default credentials. Once logged in, you can update your password and complete your profile in the <strong>Profile</strong> section.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
