import React, { useState } from "react";

export const Avatar = ({
  user,
  src,
  name,
  role,
  size = 44,
  borderRadius = "50%",
  style = {},
  className = "",
  showBadge = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const photoUrl = src || user?.profilePicture || user?.avatarUrl;
  const displayName = name || user?.name || "User";
  const displayRole = role || user?.role || "user";
  const initial = (displayName.trim()?.[0] || "U").toUpperCase();

  const numSize = typeof size === "number" ? `${size}px` : size;
  const fontSize = typeof size === "number" ? `${Math.max(12, Math.round(size * 0.42))}px` : "1rem";

  const getBackground = (r) => {
    switch (r?.toLowerCase()) {
      case "student":
        return "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)";
      case "admin":
        return "linear-gradient(135deg, #059669 0%, #047857 100%)";
      case "alumni":
      default:
        return "linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)";
    }
  };

  const hasValidPhoto = Boolean(photoUrl && photoUrl.trim() && !imageError);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: numSize,
        height: numSize,
        minWidth: numSize,
        minHeight: numSize,
        borderRadius: borderRadius,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        ...style,
      }}
    >
      {hasValidPhoto ? (
        <img
          src={photoUrl}
          alt={displayName}
          onError={() => setImageError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: borderRadius,
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: getBackground(displayRole),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontWeight: 700,
            fontFamily: "var(--font-heading, inherit)",
            fontSize: fontSize,
            userSelect: "none",
            borderRadius: borderRadius,
          }}
        >
          {initial}
        </div>
      )}

      {showBadge && (
        <div
          style={{
            position: "absolute",
            bottom: "0px",
            right: "0px",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#10b981",
            border: "2px solid #ffffff",
          }}
        />
      )}
    </div>
  );
};

export default Avatar;
