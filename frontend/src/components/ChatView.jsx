import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, getSocket } from "../services/api";
import { Avatar } from "./Avatar";
import {
  MessageSquare,
  Send,
  User,
  Plus,
  X,
  Search,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

export const ChatView = ({ currentUser, targetUser, activeTargetUser }) => {
  const navigate = useNavigate();
  const initialTarget = targetUser || activeTargetUser;

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // New Chat Modal / User selection
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [communityUsers, setCommunityUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef(null);
  const socket = getSocket();
  const [online, setOnline] = useState(Boolean(socket?.connected));
  const [convFilter, setConvFilter] = useState("");

  useEffect(() => {
    if (!socket) return undefined;
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    setOnline(Boolean(socket.connected));
    socket.on("connect", up);
    socket.on("disconnect", down);
    return () => {
      socket.off("connect", up);
      socket.off("disconnect", down);
    };
  }, [socket]);

  // 1. Fetch available community members to start new chats with
  const fetchCommunityUsers = async () => {
    try {
      const res = await api.getUsers();
      const others = (res.data || []).filter((u) => u._id !== currentUser?._id);
      setCommunityUsers(others);
    } catch (err) {
      console.error("Failed to load community members:", err);
    }
  };

  // 2. Fetch user's active conversations
  const fetchConversations = async () => {
    if (!currentUser?._id) return;
    setLoadingConv(true);
    try {
      const res = await api.getConversations(currentUser._id);
      const convList = (res.data || []).filter((c) => c.participantOneId && c.participantTwoId);
      setConversations(convList);

      // If user came from "Chat" button on a profile, auto-open/create that conversation
      if (initialTarget && initialTarget._id !== currentUser._id) {
        const existing = convList.find((c) =>
          (c.participantOneId?._id === initialTarget._id || c.participantTwoId?._id === initialTarget._id)
        );
        if (existing) {
          setActiveConversation(existing);
        } else {
          // Create new conversation
          const createRes = await api.createConversation(currentUser._id, initialTarget._id);
          if (createRes.data) {
            setConversations((prev) => [createRes.data, ...prev]);
            setActiveConversation(createRes.data);
          }
        }
      } else if (convList.length > 0 && !activeConversation) {
        setActiveConversation(convList[0]);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    fetchCommunityUsers();
    fetchConversations();
  }, [currentUser?._id, initialTarget?._id]);

  // 3. Load messages when activeConversation changes & join Socket.io room
  useEffect(() => {
    if (!activeConversation?._id || !currentUser?._id) return;

    setLoadingMsgs(true);
    api.getMessages(activeConversation._id, currentUser._id)
      .then((res) => {
        setMessages(res.data || []);
      })
      .catch((err) => console.error("Failed to load messages:", err))
      .finally(() => setLoadingMsgs(false));

    // Join room on Socket.io
    socket.emit(
      "join-conversation",
      { conversationId: activeConversation._id, userId: currentUser._id },
      (ack) => {
        if (ack?.success) {
          console.log("Joined socket conversation room:", activeConversation._id);
        }
      }
    );

        // Listen for incoming messages
    const handleReceiveMessage = (newMsg) => {
      if (newMsg.conversationId === activeConversation?._id) {
        setMessages((prev) => {
          // Prevent duplicates by real _id
          if (prev.some((m) => m._id === newMsg._id)) return prev;

          // If current user is sender (e.g. from another tab or late ack), replace optimistic temp message
          const msgSenderId = typeof newMsg.senderId === "object" ? newMsg.senderId?._id : newMsg.senderId;
          if (msgSenderId === currentUser?._id) {
            const tempIdx = prev.findIndex(
              (m) => m._id?.startsWith?.("temp_") && m.text === newMsg.text
            );
            if (tempIdx !== -1) {
              const updated = [...prev];
              updated[tempIdx] = newMsg;
              return updated;
            }
          }

          return [...prev, newMsg];
        });
      }
    };

    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
    };
  }, [activeConversation?._id, currentUser?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start chat with selected user
  const handleStartChatWithUser = async (targetPerson) => {
    setShowNewChatModal(false);
    if (!targetPerson?._id || !currentUser?._id) return;

    // Check if conversation already exists in state
    const existing = conversations.find(
      (c) =>
        c.participantOneId?._id === targetPerson._id ||
        c.participantTwoId?._id === targetPerson._id
    );

    if (existing) {
      setActiveConversation(existing);
      return;
    }

    try {
      const res = await api.createConversation(currentUser._id, targetPerson._id);
      if (res.data) {
        setConversations((prev) => [res.data, ...prev]);
        setActiveConversation(res.data);
      }
    } catch (err) {
      console.error("Failed to start new conversation:", err);
    }
  };

    // Send Message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation?._id || !currentUser?._id) return;

    const textToSend = inputText.trim();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setInputText("");

    // Optimistic UI update
    const optimisticMsg = {
      _id: tempId,
      conversationId: activeConversation._id,
      senderId: currentUser,
      text: textToSend,
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Emit via socket
    socket.emit(
      "send-message",
      {
        conversationId: activeConversation._id,
        senderId: currentUser._id,
        text: textToSend,
      },
      async (ack) => {
        if (ack?.success && ack.data) {
          setMessages((prev) =>
            prev.map((m) => (m._id === tempId ? ack.data : m))
          );
        } else {
          // REST API fallback
          try {
            const res = await api.sendMessage(
              activeConversation._id,
              currentUser._id,
              textToSend
            );
            if (res.data) {
              setMessages((prev) =>
                prev.map((m) => (m._id === tempId ? res.data : m))
              );
            }
          } catch (err) {
            console.error("Failed to send message via REST fallback:", err);
            setMessages((prev) => prev.filter((m) => m._id !== tempId));
          }
        }
      }
    );
  };

  const getCounterpart = (conv) => {
    if (!conv) return null;
    return conv.participantOneId?._id === currentUser?._id
      ? conv.participantTwoId
      : conv.participantOneId;
  };

  const activeCounterpart = getCounterpart(activeConversation);

  const filteredCommunity = communityUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.currentCompany?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const [mobileShowChat, setMobileShowChat] = useState(Boolean(initialTarget));

  const visibleConversations = conversations.filter((conv) => {
    if (!convFilter.trim()) return true;
    const p = getCounterpart(conv);
    const q = convFilter.toLowerCase();
    return p?.name?.toLowerCase().includes(q) || p?.currentCompany?.toLowerCase().includes(q);
  });

  const dayLabel = (d) => {
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" });
  };

  return (
    <div className="page-container" style={{ paddingTop: "20px", paddingBottom: "20px" }}>
      {/* Container Panel: Clean White on Cream Canvas */}
      <div className="chat-container-grid">
        {/* ========================================================================= */}
        {/* Left Sidebar: Conversations & Contacts List                              */}
        {/* ========================================================================= */}
        <div className={`chat-sidebar-panel ${mobileShowChat ? "mobile-hidden" : ""}`} style={{
          background: "#fbf9f4",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}>
          {/* Header */}
          <div className="chat-sidebar__head">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Messages</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>
                  {conversations.length} conversation{conversations.length === 1 ? "" : "s"}
                </span>
              </div>

              <button
                onClick={() => setShowNewChatModal(true)}
                className="btn btn-primary btn-sm"
                title="Start a new chat with an alumnus or student"
              >
                <Plus size={14} /> New
              </button>
            </div>

            {conversations.length > 3 && (
              <div className="search-field search-field--wide" style={{ marginTop: "12px" }}>
                <Search size={15} />
                <input
                  className="input-control"
                  value={convFilter}
                  onChange={(e) => setConvFilter(e.target.value)}
                  placeholder="Search conversations"
                  aria-label="Search conversations"
                  style={{ minHeight: "36px", fontSize: "0.85rem" }}
                />
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
            {loadingConv ? (
              <div aria-busy="true" aria-label="Loading conversations" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton-row" style={{ height: "58px", borderRadius: "var(--radius-sm)" }} />)}
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(24, 24, 27, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  color: "#18181b",
                }}>
                  <MessageSquare size={22} />
                </div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#18181b", marginBottom: "6px" }}>
                  No messages yet
                </h4>
                <p style={{ fontSize: "0.82rem", color: "#78716c", marginBottom: "16px", lineHeight: 1.4 }}>
                  Connect with alumni or peers to ask questions, discuss referrals, or get career guidance.
                </p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="btn btn-primary btn-sm"
                  style={{ width: "100%" }}
                >
                  <Plus size={14} /> Start a Conversation
                </button>
              </div>
            ) : (
              visibleConversations.map((conv) => {
                const partner = getCounterpart(conv);
                const isActive = activeConversation?._id === conv._id;

                return (
                  <button
                    type="button"
                    key={conv._id}
                    onClick={() => {
                      setActiveConversation(conv);
                      setMobileShowChat(true);
                    }}
                    className={`conv-item${isActive ? " is-active" : ""}`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <Avatar user={partner} size={40} />

                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div className="conv-item__name">{partner?.name || "Participant"}</div>
                      <div className="conv-item__meta">
                        {partner?.currentCompany ? `${partner.currentCompany} · ` : ""}
                        <span style={{ textTransform: "capitalize" }}>{partner?.role || "Member"}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
            {!loadingConv && conversations.length > 0 && visibleConversations.length === 0 && (
              <div style={{ padding: "20px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-subtle)" }}>
                No conversations match.
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Right Chat Area: Active Conversation Window                               */}
        {/* ========================================================================= */}
        <div className={`chat-main-panel ${!mobileShowChat ? "mobile-hidden" : ""}`} style={{ display: "flex", flexDirection: "column", height: "100%", background: "#ffffff" }}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
                gap: "8px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="btn btn-secondary btn-sm chat-back-btn"
                    style={{ padding: "5px 8px" }}
                    title="Back to conversations list"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div
                    onClick={() => activeCounterpart?._id && navigate(`/profile/${activeCounterpart._id}`)}
                    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: activeCounterpart?._id ? "pointer" : "default", minWidth: 0 }}
                    title="Click to view full LinkedIn-style profile"
                  >
                    <Avatar user={activeCounterpart} size={36} />

                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: "0.98rem", fontWeight: 800, color: "#18181b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {activeCounterpart?.name || "Conversation"}
                      </h3>
                      <div style={{ fontSize: "0.72rem", color: "#78716c", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {[activeCounterpart?.currentRole, activeCounterpart?.currentCompany].filter(Boolean).join(" at ") || <span style={{ textTransform: "capitalize" }}>{activeCounterpart?.role}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  {activeCounterpart?._id && (
                    <button
                      onClick={() => navigate(`/profile/${activeCounterpart._id}`)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: "5px 12px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      title="View full LinkedIn profile"
                    >
                      <User size={13} /> View Profile
                    </button>
                  )}

                  <div className="live-dot" title={online ? "Connected: messages arrive instantly" : "Reconnecting..."}>
                    <span className={online ? "is-on" : ""} />
                    {online ? "Live" : "Offline"}
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px clamp(14px, 3vw, 28px)",
                display: "flex",
                flexDirection: "column",
                background: "#fbf9f4",
              }}>
                {loadingMsgs ? (
                  <div style={{ textAlign: "center", color: "#78716c", margin: "auto" }}>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#78716c", margin: "auto" }}>
                    <Avatar user={activeCounterpart} size={56} style={{ display: "flex", margin: "0 auto 12px" }} />
                    <div style={{ fontWeight: 700, color: "#18181b", marginBottom: "4px" }}>Start the conversation</div>
                    <div style={{ fontSize: "0.85rem" }}>Send a friendly message to {activeCounterpart?.name || "your peer"}.</div>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const senderOf = (m) => m?.senderId?._id || m?.senderId;
                    const isMe = senderOf(msg) === currentUser?._id;
                    const prev = messages[i - 1];
                    const next = messages[i + 1];
                    const newDay = !prev || new Date(prev.sentAt).toDateString() !== new Date(msg.sentAt).toDateString();
                    const sameAsNext = next && senderOf(next) === senderOf(msg) &&
                      new Date(next.sentAt).toDateString() === new Date(msg.sentAt).toDateString() &&
                      new Date(next.sentAt) - new Date(msg.sentAt) < 5 * 60 * 1000;

                    return (
                      <React.Fragment key={msg._id || i}>
                        {newDay && <div className="chat-day"><span>{dayLabel(msg.sentAt)}</span></div>}
                        <div className={`bubble-row${isMe ? " is-me" : ""}${sameAsNext ? " is-grouped" : ""}`}>
                          <div className="bubble">{msg.text}</div>
                          {!sameAsNext && (
                            <span className="bubble-time">
                              {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid var(--border-color)",
                  display: "flex",
                  gap: "12px",
                  background: "#ffffff",
                  alignItems: "center",
                }}
              >
                <input
                  className="input-control"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${activeCounterpart?.name || "participant"}...`}
                  aria-label="Message"
                  style={{
                    borderRadius: "var(--radius-full)",
                    paddingLeft: "18px",
                    background: "#fbf9f4",
                  }}
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="btn btn-primary"
                  style={{
                    borderRadius: "var(--radius-full)",
                    width: "44px",
                    height: "44px",
                    padding: 0,
                    flexShrink: 0,
                  }}
                  title="Send message"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px", textAlign: "center" }}>
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(24, 24, 27, 0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                color: "#18181b",
              }}>
                <MessageSquare size={28} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#18181b", marginBottom: "8px" }}>
                Select a conversation
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#78716c", maxWidth: "340px", marginBottom: "20px" }}>
                Choose an existing thread on the left, or click below to message any verified alumnus or peer.
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="btn btn-primary"
                style={{ padding: "10px 20px" }}
              >
                <Plus size={16} /> Start a New Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* New Chat Modal: Select Any Community Member to Message                   */}
      {/* ========================================================================= */}
      {showNewChatModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "480px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#18181b" }}>Start New Chat</h3>
                <span style={{ fontSize: "0.8rem", color: "#78716c" }}>Choose a peer or alumnus to message</span>
              </div>

              <button
                onClick={() => setShowNewChatModal(false)}
                className="btn btn-secondary btn-sm icon-btn"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <Search size={16} style={{ position: "absolute", left: "14px", top: "13px", color: "#78716c" }} />
              <input
                className="input-control"
                style={{ paddingLeft: "40px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, company, or role..."
              />
            </div>

            {/* Members List */}
            <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              {filteredCommunity.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#78716c", fontSize: "0.85rem" }}>
                  No matching members found.
                </div>
              ) : (
                filteredCommunity.map((u) => (
                  <button
                    type="button"
                    key={u._id}
                    onClick={() => handleStartChatWithUser(u)}
                    className="conv-item conv-item--bordered"
                  >
                    <Avatar user={u} size={36} />
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div className="conv-item__name">{u.name}</div>
                      <div className="conv-item__meta">
                        {u.currentCompany ? `${u.currentCompany} · ` : ""}
                        <span style={{ textTransform: "capitalize" }}>{u.role}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-amber)" }}>Message →</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
