import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  Award,
  Plus,
  BookOpen,
  Building,
  User,
  ExternalLink,
} from "lucide-react";

export const SuccessStoriesView = ({ currentUser, onOpenSubmitStoryModal }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");

  const categories = [
    { id: "", label: "All Stories" },
    { id: "placement", label: "Placements" },
    { id: "internship", label: "Internships" },
    { id: "career-transition", label: "Career Transitions" },
    { id: "interview-experience", label: "Interview Journeys" },
  ];

  const fetchStories = async () => {
    setLoading(true);
    try {
      const res = await api.getSuccessStories({
        category: category || undefined,
      });
      setStories(res.data || []);
    } catch (err) {
      console.error("Failed to load success stories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [category]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="responsive-page-header">
        <div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800 }}>Alumni Success Stories</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Real experiences from graduates who cracked top roles, transitioned fields, and leveraged campus mentorship.
          </p>
        </div>

        {currentUser?.role !== "student" && (
          <button onClick={onOpenSubmitStoryModal} className="btn btn-amber">
            <Plus size={16} /> Share Your Story
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            style={{
              padding: "7px 16px",
              borderRadius: "var(--radius-sm)",
              border: category === c.id ? "1px solid var(--accent-amber)" : "1px solid var(--border-color)",
              background: category === c.id ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.04)",
              color: category === c.id ? "#fbbf24" : "var(--text-muted)",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Stories Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          Loading success stories...
        </div>
      ) : stories.length === 0 ? (
        <div className="glass-panel" style={{ padding: "50px", textAlign: "center" }}>
          <Award size={48} style={{ color: "var(--text-subtle)", marginBottom: "16px" }} />
          <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>No Stories in this Category</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Be the first alumnus to publish your career journey!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {stories.map((story) => (
            <div key={story._id} className="glass-panel glass-panel-hover" style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <span className="badge badge-amber" style={{ textTransform: "capitalize" }}>
                  {story.category?.replace("-", " ")}
                </span>

                <span style={{ fontSize: "0.78rem", color: "var(--text-subtle)" }}>
                  {new Date(story.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "12px", color: "#fff" }}>
                {story.title}
              </h2>

              <p style={{ fontSize: "0.94rem", color: "var(--text-muted)", lineHeight: 1.65, marginBottom: "20px", whiteSpace: "pre-line" }}>
                {story.story}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f59e0b, #ec4899)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "#fff",
                }}>
                  {story.authorId?.name?.[0] || "A"}
                </div>

                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
                    {story.authorId?.name}
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-subtle)" }}>
                    {story.authorId?.currentRole ? `${story.authorId.currentRole} ${story.authorId.currentCompany ? `@ ${story.authorId.currentCompany}` : ""}` : `Batch of ${story.authorId?.batch || "Alumni"}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
