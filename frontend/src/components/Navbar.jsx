import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar } from "./Avatar";
import {
  Sparkles,
  Users,
  Calendar,
  Briefcase,
  MessageSquare,
  Compass,
  Award,
  ShieldCheck,
  LogIn,
  LogOut,
  User,
} from "lucide-react";

export const Navbar = ({
  currentUser,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navTabs = [
    { path: "/alumni", label: "Alumni Directory", icon: Users },
    { path: "/mentorship", label: "Mentorship", icon: Calendar },
    { path: "/referrals", label: "Referrals", icon: Briefcase },
    { path: "/chat", label: "Chat", icon: MessageSquare },
    { path: "/opportunities", label: "Opportunities", icon: Compass },
    { path: "/forum", label: "Forum", icon: MessageSquare },
    { path: "/events", label: "Events", icon: Calendar },
    { path: "/stories", label: "Stories", icon: Award },
    { path: "/profile", label: "My Profile", icon: User },
    { path: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
  ];

  const visibleTabs = navTabs.filter((tab) => {
    if (currentUser?.role === "admin") {
      return tab.path === "/admin" || tab.path === "/events";
    }
    return !tab.adminOnly;
  });

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(251, 249, 244, 0.97)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border-color)",
      boxShadow: "0 2px 14px rgba(28, 25, 23, 0.06)",
    }}>
      {/* ========================================================================= */}
      {/* 1st Tier (Main Top Navbar): Logo, Branding, User Profile & Auth Controls  */}
      {/* ========================================================================= */}
      <div style={{
        maxWidth: "1440px",
        margin: "0 auto",
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "60px",
        borderBottom: currentUser ? "1px solid rgba(0, 0, 0, 0.06)" : "none",
        gap: "12px",
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => navigate(currentUser?.role === "admin" ? "/admin" : "/alumni")}
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flexShrink: 0 }}
        >
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "#ffffff",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            flexShrink: 0,
            overflow: "hidden",
            padding: "3px",
          }}>
            <img
              src="/logo.png"
              alt="Alumni Connect Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
          <div>
            <div style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.05rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#18181b",
              lineHeight: 1.1,
            }}>
              ALUMNI CONNECT
            </div>
            <div style={{ fontSize: "0.65rem", color: "#92400e", fontWeight: 700, letterSpacing: "0.1em" }}>
              THAPAR ECOSYSTEM
            </div>
          </div>
        </div>

        {/* User Identity & Auth Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {currentUser ? (
            <div style={{
              background: "#ffffff",
              border: "1px solid rgba(0, 0, 0, 0.12)",
              borderRadius: "var(--radius-full)",
              padding: "4px 8px 4px 6px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
              maxWidth: "100%",
            }}>
              {/* User Avatar & Info (Click to view profile) */}
              <div
                onClick={() => navigate(currentUser?.role === "admin" ? "/admin" : "/profile")}
                style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                title="View and edit your profile"
              >
                <Avatar
                  user={currentUser}
                  size={30}
                />

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#18181b", lineHeight: 1.1, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentUser.name}
                  </span>

                  <span style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: currentUser.role === "student" ? "#0284c7" : currentUser.role === "admin" ? "#059669" : "#b45309",
                  }}>
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Sign Out */}
              <button
                onClick={onLogout}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                  borderRadius: "var(--radius-full)",
                  color: "#be123c",
                  borderColor: "rgba(190, 18, 60, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginLeft: "4px",
                }}
                title="Sign out of this account"
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="btn btn-primary btn-sm"
              style={{ padding: "7px 14px", fontSize: "0.82rem" }}
            >
              <LogIn size={14} /> Sign In
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2nd Tier (Sub-Navbar): Feature Navigation Tabs Dedicated Bar             */}
      {/* ========================================================================= */}
      {currentUser && (
        <div style={{
          background: "#f1ece0",
          borderTop: "1px solid rgba(0, 0, 0, 0.04)",
        }}>
          <div style={{
            maxWidth: "1440px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            height: "46px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}>
            <nav style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = location.pathname === tab.path;
                return (
                  <button
                    key={tab.path}
                    onClick={() => navigate(tab.path)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "6px 14px",
                      borderRadius: "var(--radius-sm)",
                      background: isActive ? "#18181b" : "transparent",
                      color: isActive ? "#fbf9f4" : "#44403c",
                      border: isActive ? "1px solid #18181b" : "1px solid transparent",
                      fontFamily: "var(--font-heading)",
                      fontSize: "0.85rem",
                      fontWeight: isActive ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                      boxShadow: isActive ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "none",
                    }}
                  >
                    <Icon size={15} color={isActive ? "#fbf9f4" : "#57534e"} />
                    <span style={{ color: isActive ? "#fbf9f4" : "#44403c" }}>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
