import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { Avatar } from "./Avatar";
import {
  Briefcase,
  GraduationCap,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  MessageSquare,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Mail,
  Sparkles,
  ArrowLeft,
  Building,
  MapPin,
  FileText,
  Edit3,
  X,
  Compass,
  Award,
} from "lucide-react";

/**
 * LinkedIn-Style Profile View
 * Renders an alumnus or student's complete professional profile,
 * experience timeline, education, skills, and networking actions.
 */
export const PublicProfileView = ({
  currentUser,
  userId: propUserId,
  onStartChat,
  onOpenMentorshipModal,
  onOpenReferralModal,
  isModal = false,
  onClose = null,
}) => {
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();

  const targetUserId = propUserId || routeUserId || currentUser?._id;
  const isMe = currentUser?._id && targetUserId === currentUser._id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!targetUserId) {
      setError("No user ID specified.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    api
      .getUserProfile(targetUserId)
      .then((res) => {
        if (isMounted) {
          setUser(res.data || null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load user profile.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [targetUserId]);

  const handleCopyProfileLink = () => {
    const url = `${window.location.origin}/profile/${targetUserId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1060px", margin: "40px auto", padding: "0 20px", textAlign: "center" }}>
        <div style={{ padding: "60px 0", color: "#78716c", fontSize: "0.95rem" }}>
          <div className="spin-animation" style={{ display: "inline-block", marginBottom: "12px", fontSize: "1.8rem" }}>
            🌀
          </div>
          <div>Loading LinkedIn-style profile...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ maxWidth: "1060px", margin: "40px auto", padding: "0 20px" }}>
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "48px 24px",
          textAlign: "center",
        }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#18181b", marginBottom: "8px" }}>
            Profile Not Found
          </h2>
          <p style={{ color: "#78716c", fontSize: "0.9rem", maxWidth: "480px", margin: "0 auto 20px" }}>
            {error || "The profile you are looking for does not exist or has been removed."}
          </p>
          <button onClick={() => navigate("/alumni")} className="btn btn-primary">
            <ArrowLeft size={16} /> Back to Directory
          </button>
        </div>
      </div>
    );
  }

  // Work experience items: If array exists on user, use it. Otherwise synthesize current role
  const experienceItems = Array.isArray(user.experience) && user.experience.length > 0
    ? user.experience
    : user.currentCompany || user.currentRole
    ? [
        {
          company: user.currentCompany || "Company",
          role: user.currentRole || "Professional",
          dates: "July 2024 - Present",
          description: `Active professional role within the ${user.industry || "Technology"} sector.`,
        },
      ]
    : [];

  return (
    <div style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: isModal ? "0" : "24px 20px 60px",
      width: "100%",
      boxSizing: "border-box",
    }}>
      {/* Top Navigation Row (Full Page mode) */}
      {!isModal && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "transparent",
              border: "none",
              color: "#475569",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handleCopyProfileLink}
              style={{
                background: "#ffffff",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#1e293b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {copiedLink ? <Check size={14} color="#059669" /> : <Share2 size={14} />}
              {copiedLink ? "Link Copied!" : "Share Profile"}
            </button>
            {isMe && (
              <button
                onClick={() => navigate("/profile")}
                className="btn btn-secondary btn-sm"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main LinkedIn Profile Card */}
      <div style={{
        background: "#ffffff",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.05)",
        marginBottom: "20px",
      }}>
        {/* Cover Banner with Thapar Network branding */}
        <div style={{
          height: "190px",
          background: "linear-gradient(135deg, #091e42 0%, #0a4d8c 45%, #0284c7 85%, #38bdf8 100%)",
          position: "relative",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
          {/* Decorative mesh circles */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px)",
            backgroundSize: "22px 22px",
            opacity: 0.6,
            pointerEvents: "none",
          }} />

          {/* Institutional Badge */}
          <div style={{
            position: "relative",
            zIndex: 1,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(8px)",
            padding: "6px 14px",
            borderRadius: "30px",
            color: "#ffffff",
            fontSize: "0.78rem",
            fontWeight: 700,
            border: "1px solid rgba(255, 255, 255, 0.25)",
            letterSpacing: "0.3px",
          }}>
            <GraduationCap size={15} color="#fde047" /> Thapar Institute Alumni Network
          </div>

          {/* Close button if in modal */}
          {isModal && onClose && (
            <button
              onClick={onClose}
              style={{
                position: "relative",
                zIndex: 2,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.4)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Profile Header Content (Avatar, Names, Badges, Action Buttons) */}
        <div style={{ padding: "0 28px 24px", position: "relative" }}>
          {/* Avatar overlapping banner */}
          <div style={{
            marginTop: "-65px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}>
            <div style={{
              position: "relative",
              borderRadius: "50%",
              padding: "4px",
              background: "#ffffff",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.14)",
              display: "inline-block",
            }}>
              <Avatar
                user={user}
                size={115}
                style={{ borderRadius: "50%", display: "block" }}
              />
              {user.isVerified && (
                <div
                  title="Verified Alumnus"
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    right: "6px",
                    background: "#059669",
                    color: "#ffffff",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    border: "2px solid #ffffff",
                  }}
                >
                  <CheckCircle2 size={16} />
                </div>
              )}
            </div>

            {/* Quick Actions (Message, Mentorship, Referral) */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {!isMe && (
                <button
                  onClick={() => {
                    if (onStartChat) onStartChat(user);
                    else navigate("/chat");
                  }}
                  className="btn btn-primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 18px",
                    borderRadius: "24px",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                  }}
                >
                  <MessageSquare size={16} /> Message
                </button>
              )}

              {!isMe && user.role === "alumni" && user.availableForMentorshipCalls && (
                <button
                  onClick={() => {
                    if (onOpenMentorshipModal) onOpenMentorshipModal(user);
                    else navigate("/mentorship");
                  }}
                  className="btn btn-secondary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 18px",
                    borderRadius: "24px",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "#0a66c2",
                    borderColor: "#0a66c2",
                  }}
                >
                  <Calendar size={16} /> Request Call
                </button>
              )}

              {!isMe && user.role === "alumni" && user.willingToRefer && (
                <button
                  onClick={() => {
                    if (onOpenReferralModal) onOpenReferralModal(user);
                    else navigate("/referrals");
                  }}
                  className="btn btn-secondary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 18px",
                    borderRadius: "24px",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "#b45309",
                    borderColor: "#f59e0b",
                  }}
                >
                  <Briefcase size={16} /> Ask Referral
                </button>
              )}

              {user.linkedinUrl && (
                <a
                  href={user.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "24px",
                    background: "#0a66c2",
                    color: "#ffffff",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <span style={{ fontWeight: 900, fontSize: "0.95rem" }}>in</span> LinkedIn Profile <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>

          {/* Name & Headline & Verification */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#18181b", margin: 0 }}>
                {user.name}
              </h1>
              {user.isVerified && (
                <span className="badge badge-emerald" style={{ fontSize: "0.76rem" }}>
                  <ShieldCheck size={13} /> Verified TIET Alumnus
                </span>
              )}
              <span className={`badge badge-${user.role === "student" ? "cyan" : user.role === "admin" ? "emerald" : "indigo"}`}>
                {user.role === "alumni" ? "🎓 Alumnus" : user.role === "student" ? "📚 Student" : "🛡️ Admin"}
              </span>
            </div>

            {/* LinkedIn-style headline */}
            <p style={{
              fontSize: "1.05rem",
              fontWeight: 500,
              color: "#334155",
              margin: "6px 0 8px",
              lineHeight: 1.45,
            }}>
              {user.currentRole && user.currentCompany
                ? `${user.currentRole} at ${user.currentCompany}${user.batch ? ` || Thapar'${String(user.batch).slice(-2)}` : ""}`
                : user.bio || `${user.branch || "Engineering"} · Thapar Institute of Engineering & Technology`}
            </p>

            {/* Sub-meta details row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              fontSize: "0.86rem",
              color: "#64748b",
              marginBottom: "14px",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <MapPin size={15} color="#94a3b8" /> Patiala, Punjab, India
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Building size={15} color="#94a3b8" /> Thapar Institute of Engineering & Technology
              </span>
              {user.batch && (
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <GraduationCap size={15} color="#94a3b8" /> Class of {user.batch}
                </span>
              )}
            </div>

            {/* Pill chips for availability */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {user.availableForMentorshipCalls && (
                <span style={{
                  background: "rgba(10, 102, 194, 0.08)",
                  border: "1px solid rgba(10, 102, 194, 0.25)",
                  color: "#0a66c2",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  <Calendar size={13} /> Open for 1-on-1 Mentorship
                </span>
              )}

              {user.willingToRefer && (
                <span style={{
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  color: "#b45309",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  <Briefcase size={13} /> Willing to Refer Candidates
                </span>
              )}

              {user.industry && (
                <span style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}>
                  🌐 {user.industry}
                </span>
              )}
            </div>

            {/* Contact details pill bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
              paddingTop: "14px",
              borderTop: "1px solid #f1f5f9",
              fontSize: "0.82rem",
            }}>
              {user.email && (
                <button
                  type="button"
                  onClick={() => handleCopyEmail(user.email)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#0a66c2",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: 0,
                  }}
                  title="Click to copy email address"
                >
                  <Mail size={14} /> {user.email}
                  {copiedEmail ? <Check size={12} color="#059669" /> : <Copy size={12} color="#94a3b8" />}
                </button>
              )}

              {user.githubUrl && (
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#334155", display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none" }}
                >
                  <span>💻 GitHub</span> <ExternalLink size={12} />
                </a>
              )}

              {user.resumeUrl && (
                <a
                  href={user.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#059669", display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none", fontWeight: 600 }}
                >
                  <span>📄 Verified Resume</span> <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Left = Detailed LinkedIn Cards, Right = Sidebar Meta */}
      <div className="responsive-split-grid" style={{ alignItems: "flex-start", gap: "20px" }}>
        {/* Left Column (About, Experience Timeline, Education, Skills, Expertise) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 1. About Card */}
          {user.bio && (
            <div style={{
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)",
              padding: "24px 28px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            }}>
              <h3 style={{ fontSize: "1.18rem", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={18} color="#0a66c2" /> About
              </h3>
              <p style={{
                fontSize: "0.92rem",
                color: "#334155",
                lineHeight: 1.6,
                margin: 0,
                whiteSpace: "pre-line",
              }}>
                {user.bio}
              </p>
            </div>
          )}

          {/* 2. Experience Section (LinkedIn Work History Timeline) */}
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "24px 28px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          }}>
            <h3 style={{ fontSize: "1.18rem", fontWeight: 700, color: "#18181b", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Briefcase size={18} color="#0a66c2" /> Experience
            </h3>

            {experienceItems.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {experienceItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "16px",
                      position: "relative",
                      paddingBottom: idx !== experienceItems.length - 1 ? "18px" : "0",
                      borderBottom: idx !== experienceItems.length - 1 ? "1px solid #f1f5f9" : "none",
                    }}
                  >
                    {/* Company Initial / Logo Circle */}
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
                      border: "1px solid #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      color: "#1e293b",
                      fontSize: "1.1rem",
                      flexShrink: 0,
                    }}>
                      {item.company ? item.company.charAt(0).toUpperCase() : "🏢"}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: "1.02rem", fontWeight: 700, color: "#0f172a" }}>
                        {item.role || "Software Professional"}
                      </h4>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#0a66c2", marginTop: "2px" }}>
                        {item.company}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                        {item.dates || "Present"}
                      </div>
                      {item.description && (
                        <p style={{ margin: "6px 0 0", fontSize: "0.84rem", color: "#475569", lineHeight: 1.5 }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#64748b", fontSize: "0.86rem" }}>
                No past experience recorded yet.
              </div>
            )}
          </div>

          {/* 3. Education Section */}
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "24px 28px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          }}>
            <h3 style={{ fontSize: "1.18rem", fontWeight: 700, color: "#18181b", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
              <GraduationCap size={18} color="#0a66c2" /> Education
            </h3>

            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
                flexShrink: 0,
              }}>
                🎓
              </div>

              <div>
                <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                  Thapar Institute of Engineering & Technology
                </h4>
                <div style={{ fontSize: "0.9rem", color: "#334155", marginTop: "3px" }}>
                  Bachelor of Technology - B.Tech, {user.branch || "Engineering"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                  {user.batch ? `${user.batch - 4} - ${user.batch}` : "2020 - 2024"} · Patiala, Punjab
                </div>
              </div>
            </div>
          </div>

          {/* 4. Skills & Endorsements */}
          {user.skills && user.skills.length > 0 && (
            <div style={{
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)",
              padding: "24px 28px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            }}>
              <h3 style={{ fontSize: "1.18rem", fontWeight: 700, color: "#18181b", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} color="#0a66c2" /> Skills
              </h3>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {user.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "0.84rem",
                      fontWeight: 600,
                      color: "#1e293b",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 5. Areas of Expertise / Mentorship Domains */}
          {user.areasOfExpertise && user.areasOfExpertise.length > 0 && (
            <div style={{
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)",
              padding: "24px 28px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            }}>
              <h3 style={{ fontSize: "1.18rem", fontWeight: 700, color: "#18181b", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Award size={18} color="#b45309" /> Mentorship & Expertise Domains
              </h3>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {user.areasOfExpertise.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      borderRadius: "20px",
                      padding: "5px 12px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#92400e",
                    }}
                  >
                    ★ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 6. Student Career Goals (if role === student) */}
          {user.role === "student" && user.careerGoal && (
            <div style={{
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)",
              padding: "24px 28px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
            }}>
              <h3 style={{ fontSize: "1.18rem", fontWeight: 700, color: "#18181b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Compass size={18} color="#0891b2" /> Career Goal & Interests
              </h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#334155", lineHeight: 1.55 }}>
                {user.careerGoal}
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Quick Details, Community Connection, Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card: Public Profile & URL */}
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "0.92rem", fontWeight: 700, color: "#1e293b" }}>
              Public Profile & URL
            </h4>
            <div style={{
              padding: "8px 10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "0.76rem",
              color: "#64748b",
              wordBreak: "break-all",
              marginBottom: "10px",
            }}>
              {window.location.origin}/profile/{user._id}
            </div>
            <button
              onClick={handleCopyProfileLink}
              style={{
                width: "100%",
                background: "#ffffff",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "8px",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#0a66c2",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              {copiedLink ? <Check size={14} color="#059669" /> : <Copy size={14} />}
              {copiedLink ? "Link Copied!" : "Copy Public Link"}
            </button>
          </div>

          {/* Card: Affiliation & Community */}
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "0.92rem", fontWeight: 700, color: "#1e293b" }}>
              Community Affiliation
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.84rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                <span>University</span>
                <strong style={{ color: "#0f172a" }}>TIET Patiala</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                <span>Department</span>
                <strong style={{ color: "#0f172a" }}>{user.branch || "Engineering"}</strong>
              </div>
              {user.batch && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                  <span>Graduation Class</span>
                  <strong style={{ color: "#0f172a" }}>{user.batch}</strong>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                <span>Alumni Verification</span>
                <strong style={{ color: user.isVerified ? "#059669" : "#64748b" }}>
                  {user.isVerified ? "✅ Verified" : "Standard"}
                </strong>
              </div>
            </div>
          </div>

          {/* Card: Networking Prompt */}
          {!isMe && (
            <div style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
              border: "1px solid #bae6fd",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              textAlign: "center",
            }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "0.98rem", fontWeight: 800, color: "#0f172a" }}>
                Connect with {user.name}
              </h4>
              <p style={{ margin: "0 0 14px", fontSize: "0.8rem", color: "#475569" }}>
                Reach out for career advice, mentorship calls, or industry referral discussions.
              </p>
              <button
                onClick={() => {
                  if (onStartChat) onStartChat(user);
                  else navigate("/chat");
                }}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <MessageSquare size={14} /> Send Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Slide-over / Centered Profile Modal Wrapper
 */
export const ProfileModal = ({
  isOpen,
  onClose,
  userId,
  currentUser,
  onStartChat,
  onOpenMentorshipModal,
  onOpenReferralModal,
}) => {
  if (!isOpen || !userId) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        style={{
          background: "#f8fafc",
          borderRadius: "var(--radius-lg)",
          maxWidth: "1000px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          position: "relative",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
        }}
      >
        <PublicProfileView
          currentUser={currentUser}
          userId={userId}
          onStartChat={(u) => {
            if (onClose) onClose();
            if (onStartChat) onStartChat(u);
          }}
          onOpenMentorshipModal={(u) => {
            if (onClose) onClose();
            if (onOpenMentorshipModal) onOpenMentorshipModal(u);
          }}
          onOpenReferralModal={(u) => {
            if (onClose) onClose();
            if (onOpenReferralModal) onOpenReferralModal(u);
          }}
          isModal={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
