import React, { useState, useEffect } from "react";
import { api } from "../services/api";
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
    <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "32px 20px" }}>
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
              <span>Asked by <strong style={{ color: "#fff" }}>{activePost.authorId?.name || "Student"}</strong></span>
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
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: comment.authorId?.role === "alumni"
                        ? "linear-gradient(135deg, #f59e0b, #ec4899)"
                        : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      color: "#fff",
                      fontSize: "0.9rem",
                    }}>
                      {comment.authorId?.name?.[0] || "U"}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <strong style={{ fontSize: "0.95rem", color: "#fff" }}>{comment.authorId?.name}</strong>
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
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
            <div>
              <h1 style={{ fontSize: "2.2rem", fontWeight: 800 }}>Community Discussion Forum</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                Ask questions about interview prep, tech stacks, and career paths answered by alumni with real experience.
              </p>
            </div>

            <button onClick={onOpenAskModal} className="btn btn-primary">
              <Plus size={16} /> Ask Question
            </button>
          </div>

          {/* Search & Tag filter */}
          <div className="glass-panel" style={{ padding: "16px 20px", marginBottom: "28px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Search size={18} style={{ position: "absolute", left: "14px", top: "12px", color: "var(--text-subtle)" }} />
                <input
                  className="input-control"
                  style={{ paddingLeft: "42px" }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchPosts()}
                  placeholder="Search questions (e.g. 'Amazon interview', 'System design', 'Product Management')..."
                />
              </div>

              {selectedTag && (
                <button
                  onClick={() => setSelectedTag("")}
                  className="btn btn-secondary btn-sm"
                  style={{ color: "var(--accent-rose)" }}
                >
                  Clear Tag #{selectedTag}
                </button>
              )}
            </div>
          </div>

          {/* Posts List */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
              Loading forum questions...
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-panel" style={{ padding: "50px", textAlign: "center" }}>
              <MessageSquare size={48} style={{ color: "var(--text-subtle)", marginBottom: "16px" }} />
              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>No Questions Yet</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Be the first to ask a career or interview question to the alumni network!
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {posts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => loadPostThread(post)}
                  className="glass-panel glass-panel-hover"
                  style={{
                    padding: "22px 26px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ flex: 1, marginRight: "16px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                      {(post.tags || []).map((tag, idx) => (
                        <span
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(tag);
                          }}
                          className="badge badge-indigo"
                          style={{ cursor: "pointer" }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "8px", color: "#fff" }}>
                      {post.question}
                    </h3>

                    <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)" }}>
                      Asked by {post.authorId?.name || "Student"} · {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Comment Count Badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-full)",
                      padding: "6px 14px",
                      fontSize: "0.85rem",
                      color: "var(--accent-amber)",
                      fontWeight: 600,
                    }}>
                      <MessageSquare size={15} />
                      {post.commentCount || 0} answers
                    </div>

                    <ChevronRight size={20} color="var(--text-subtle)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
