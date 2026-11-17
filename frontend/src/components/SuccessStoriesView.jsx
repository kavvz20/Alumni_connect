import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Avatar } from "./Avatar";
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
    <div className="page-container" data-accent="gold">
      {/* Header */}
      <div className="responsive-page-header">
        <div>
          <div className="page-eyebrow"><Award size={14} /> Success Stories</div>
          <h1>Alumni Success Stories</h1>
          <p>Real experiences from graduates who cracked top roles, changed fields, and grew through campus mentorship.</p>
        </div>

        {currentUser?.role !== "student" && (
          <button onClick={onOpenSubmitStoryModal} className="btn btn-amber">
            <Plus size={16} /> Share Your Story
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="toolbar">
        <div className="toolbar__chips" role="group" aria-label="Story category">
          {categories.map((c) => (
            <button
              key={c.id || "all"}
              onClick={() => setCategory(c.id)}
              className={`chip${category === c.id ? " active" : ""}`}
              aria-pressed={category === c.id}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stories */}
      {loading ? (
        <div className="list-stack" aria-busy="true" aria-label="Loading stories">
          {[0, 1].map((i) => <div key={i} className="glass-panel skeleton-card" style={{ height: "220px" }} />)}
        </div>
      ) : stories.length === 0 ? (
        <div className="empty-state">
          <Award size={40} />
          <h3>No stories here yet</h3>
          <p>Be the first alumnus to share your career journey.</p>
        </div>
      ) : (
        <div className="list-stack" style={{ gap: "20px", maxWidth: "860px" }}>
          {stories.map((story) => (
            <article key={story._id} className="glass-panel story-card">
              <div className="feed-card__top" style={{ alignItems: "center" }}>
                <span className="badge badge-gold" style={{ textTransform: "capitalize" }}>
                  {story.category?.replace(/-/g, " ")}
                </span>
                <span className="meta-row">
                  <span>{new Date(story.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                </span>
              </div>

              <h2 className="story-card__title">{story.title}</h2>
              <p className="story-card__body">{story.story}</p>

              <div className="byline" style={{ paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
                <Avatar user={story.authorId} role="alumni" size={40} />
                <div style={{ minWidth: 0 }}>
                  <strong>{story.authorId?.name || "Alumnus"}</strong>
                  {story.authorId?.currentRole
                    ? `${story.authorId.currentRole}${story.authorId.currentCompany ? ` at ${story.authorId.currentCompany}` : ""}`
                    : story.authorId?.batch ? `Class of ${story.authorId.batch}` : "Alumnus"}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
