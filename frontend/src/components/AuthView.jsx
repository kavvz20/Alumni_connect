import React, { useState } from "react";
import { api } from "../services/api";
import { describeGoogleError, getGoogleIdToken, isGoogleSignInAvailable } from "../services/firebase";
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
  GraduationCap,
} from "lucide-react";

const ROLE_OPTIONS = [
  { value: "student", label: "Student", Icon: User },
  { value: "alumni", label: "Alumni", Icon: GraduationCap },
  { value: "admin", label: "Admin", Icon: ShieldCheck },
];

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
  </svg>
);

export const AuthView = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [role, setRole] = useState("student");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google sign-in: the backend verifies the token and decides the real role
  const handleGoogleSignIn = async () => {
    setGoogleLoading("google");
    setError(null);
    try {
      const idToken = await getGoogleIdToken();
      setGoogleLoading("server");
      const res = await api.googleSignIn(idToken, role);
      if (!res?.data?.user || !res?.data?.token) {
        throw new Error("The server did not return a session. Please try again.");
      }
      onAuthSuccess(res.data);
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError(describeGoogleError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

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
              Choose your role, then continue with Google or sign in with your email and password.
            </p>
          </div>

          {/* Role selector (the server still decides the actual role) */}
          <div role="radiogroup" aria-label="Sign in as" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
            {ROLE_OPTIONS.map(({ value, label, Icon }) => {
              const selected = role === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setRole(value)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    padding: "10px 6px",
                    borderRadius: "var(--radius-sm)",
                    border: selected ? "2px solid #18181b" : "1px solid var(--border-color)",
                    background: selected ? "#fbf9f4" : "#ffffff",
                    color: selected ? "#18181b" : "#78716c",
                    fontWeight: selected ? 700 : 500,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                  }}
                >
                  <Icon size={18} />
                  {label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="btn btn-secondary"
            title={isGoogleSignInAvailable() ? undefined : "Google sign-in is not configured for this deployment."}
            style={{
              width: "100%",
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontSize: "0.95rem",
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              color: "#18181b",
            }}
          >
            <GoogleMark />
            {googleLoading === "google"
              ? "Waiting for Google..."
              : googleLoading === "server"
                ? "Signing you in (the server can take up to a minute to wake up)..."
                : `Continue with Google as ${ROLE_OPTIONS.find((r) => r.value === role).label}`}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0", color: "#a8a29e", fontSize: "0.8rem" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
            or sign in with email and password
            <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
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
                New to Alumni Connect?
              </strong>
              New accounts are created with <strong>Continue with Google</strong> above, so we know the email is really yours.
              Students must use their <strong>@thapar.edu</strong> Google account. If the Placement & Alumni Relations Cell already
              registered you, continue with Google using that email; your existing profile is linked automatically. You can set a
              password later from your profile.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
