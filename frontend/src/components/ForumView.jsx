import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Avatar } from "./Avatar";
import {
  MessageSquare,
  Plus,
  Search,
  Tag,
  Send,
  User,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

export const ForumView = ({ currentUser, onOpenAskModal }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [search, setSearch] = useState("");

  // Thread detail view
  const [activePost, setActivePost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.getForumPosts({
        tag: selectedTag || undefined,
        search: search.trim() || undefined,
      });
      setPosts(res.data || []);
    } catch (err) {
      console.error("Failed to load forum posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedTag]);

  const loadPostThread = async (post) => {
    setActivePost(post);
    try {
      const res = await api.getPostComments(post._id);
      setComments(res.data || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activePost?._id || !currentUser?._id) return;

    setSubmittingComment(true);
    try {
      const res = await api.addComment(activePost._id, commentText.trim(), currentUser._id);
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
      // update count in list
      setPosts((prev) =>
        prev.map((p) => (p._id === activePost._id ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p))
      );
    } catch (err) {
      alert(err.message || "Failed to post reply.");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="page-container" data-accent="plum">
      {activePost ? (
        /* Thread View */
        <div>
          <button
            onClick={() => setActivePost(null)}
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: "20px" }}
          >
            <ArrowLeft size={16} /> Back to All Questions
          </button>

          {/* Main Question Card */}
          <div className="glass-panel" style={{ padding: "30px", marginBottom: "28px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
              {(activePost.tags || []).map((t, idx) => (
                <span key={idx} className="badge badge-indigo">
                  #{t}
                </span>
              ))}
            </div>

            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "14px", lineHeight: 1.3 }}>
              {activePost.question}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.82rem", color: "var(--text-subtle)" }}>
              <span>Asked by <strong style={{ color: "var(--text-main)" }}>{activePost.authorId?.name || "Student"}</strong></span>
              <span>·</span>
              <span>{new Date(activePost.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Answers & Discussion Header */}
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "18px" }}>
            Alumni Insights & Answers ({comments.length})
          </h2>

          {/* Comments List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "28px" }}>
            {comments.length === 0 ? (
              <div className="glass-panel" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                No answers posted yet. Be the first alumnus or student to reply!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="glass-panel" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                    <Avatar user={comment.authorId} size={36} />

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <strong style={{ fontSize: "0.95rem", color: "var(--text-main)" }}>{comment.authorId?.name}</strong>
                        {comment.authorId?.role === "alumni" && (
                          <span className="badge badge-amber" style={{ fontSize: "0.68rem" }}>
                            Alumni
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>
                        {comment.authorId?.currentRole ? `${comment.authorId.currentRole} ${comment.authorId.currentCompany ? `@ ${comment.authorId.currentCompany}` : ""}` : comment.authorId?.branch}
                      </div>
                    </div>

                    <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)", marginLeft: "auto" }}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.92rem", color: "var(--text-main)", lineHeight: 1.5, paddingLeft: "48px" }}>
                    {comment.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Add Answer / Reply Box - Only Alumni & Admin can answer */}
          {currentUser?.role !== "student" ? (
            <form onSubmit={handleAddComment} className="glass-panel" style={{ padding: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                Share Your Guidance or Experience (Alumni / Mentor Answer)
              </label>
              <textarea
                className="textarea-control"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your answer or insights here..."
                style={{ minHeight: "80px", marginBottom: "12px" }}
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="btn btn-primary"
              >
                <Send size={15} /> Post Answer
              </button>
            </form>
          ) : (
            <div style={{
              padding: "16px 20px",
              background: "rgba(146, 64, 14, 0.06)",
              border: "1px solid rgba(146, 64, 14, 0.2)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-muted)",
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <MessageSquare size={18} color="var(--accent-primary)" />
              <span>
                <strong>Community Guidelines:</strong> Answers on this forum are reserved for verified Alumni mentors. Students can ask questions and read alumni guidance.
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Questions List */
        <div>
          <div className="responsive-page-header">
            <div>
              <div className="page-eyebrow"><MessageSquare size={14} /> Community Forum</div>
              <h1>Community Discussion Forum</h1>
              <p>Ask about interview prep, tech stacks and career paths, and get answers from alumni with real experience.</p>
            </div>

            <button onClick={onOpenAskModal} className="btn btn-primary">
              <Plus size={16} /> Ask Question
            </button>
          </div>

          {/* Search & Tag filter */}
          <div className="toolbar">
            <div className="search-field search-field--wide">
              <Search size={16} />
              <input
                className="input-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchPosts()}
                placeholder="Search questions, e.g. Amazon interview or system design, then press Enter"
                aria-label="Search questions"
              />
            </div>

            {selectedTag && (
              <button onClick={() => setSelectedTag("")} className="chip active" title="Clear tag filter">
                #{selectedTag} <span aria-hidden="true">×</span>
              </button>
            )}
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="list-stack" aria-busy="true" aria-label="Loading questions">
              {[0, 1, 2].map((i) => <div key={i} className="glass-panel skeleton-row" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={40} />
              <h3>No questions yet</h3>
              <p>Be the first to ask the alumni network a career or interview question.</p>
            </div>
          ) : (
            <div className="list-stack">
              {posts.map((post) => {
                const answers = post.commentCount || 0;
                return (
                  <div
                    key={post._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => loadPostThread(post)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        loadPostThread(post);
                      }
                    }}
                    className="glass-panel glass-panel-hover thread-row"
                  >
                    <div className={`answer-count${answers > 0 ? " has-answers" : ""}`} aria-label={`${answers} answers`}>
                      <strong>{answers}</strong>
                      {answers === 1 ? "answer" : "answers"}
                    </div>

                    <div className="thread-row__body">
                      {(post.tags || []).length > 0 && (
                        <div className="tag-list">
                          {post.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTag(tag);
                              }}
                              className="tag tag--link"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <h3 className="thread-row__title">{post.question}</h3>

                      <div className="meta-row">
                        <span>Asked by <strong style={{ color: "var(--text-main)", fontWeight: 600 }}>{post.authorId?.name || "Student"}</strong></span>
                        <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>

                    <ChevronRight className="thread-row__chevron" size={20} color="var(--text-subtle)" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
