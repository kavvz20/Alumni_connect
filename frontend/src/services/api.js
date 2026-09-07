import { io } from "socket.io-client";

// Auto-sanitize backend URL to prevent trailing slashes or duplicate /api/v1 prefixes
const rawBackendUrl = (import.meta.env.VITE_BACKEND_URL || "").trim();
const cleanBackendUrl = rawBackendUrl
  .replace(/\/+$/, "")
  .replace(/\/api\/v1\/?$/, "")
  .replace(/\/api\/?$/, "");

export const BACKEND_URL = cleanBackendUrl;
export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api/v1` : "/api/v1";
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || "").trim().replace(/\/+$/, "") || BACKEND_URL || (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:8000" : window.location.origin);

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socketInstance;
};

// Generic fetch handler with error handling
const request = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const rawUrl = `${API_BASE}${cleanEndpoint}`;
  const url = rawUrl.replace(/([^:]\/)\/+/g, "$1");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}: ${text.slice(0, 100)}`);
      }
      throw new Error("Cannot reach backend server. Please verify VITE_BACKEND_URL is configured and backend is running.");
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
};

// Users API
export const api = {
  // Users
  createUser: (userData) => request("/users", { method: "POST", body: JSON.stringify(userData) }),
  login: (email, password) => request("/users/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  getUsers: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== "") query.append(key, val);
    });
    return request(`/users?${query.toString()}`);
  },
  getUserProfile: (userId) => request(`/users/${userId}`),
  updateUserProfile: (userId, updates, actorId) =>
    request(`/users/${userId}`, {
      method: "PATCH",
      headers: actorId ? { "x-user-id": actorId } : {},
      body: JSON.stringify({ ...updates, actorId }),
    }),
  onboardUser: (payload, adminId) =>
    request("/users/onboard", {
      method: "POST",
      headers: adminId ? { "x-user-id": adminId } : {},
      body: JSON.stringify({ ...payload, adminId }),
    }),
  bulkOnboardUsers: (users, adminId) =>
    request("/users/bulk-onboard", {
      method: "POST",
      headers: adminId ? { "x-user-id": adminId } : {},
      body: JSON.stringify({ users, adminId }),
    }),
  changePassword: (userId, currentPassword, newPassword) =>
    request(`/users/${userId}`, {
      method: "PATCH",
      headers: { "x-user-id": userId },
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  verifyAlumni: (userId, isVerified, adminId) =>
    request(`/users/${userId}/verify`, {
      method: "PATCH",
      headers: adminId ? { "x-user-id": adminId } : {},
      body: JSON.stringify({ isVerified, adminId }),
    }),

  // Alumni & AI Matching
  getAlumni: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== "") query.append(key, val);
    });
    return request(`/alumni?${query.toString()}`);
  },
  matchAlumniMentor: (payload, studentId) =>
    request("/alumni/match", {
      method: "POST",
      headers: studentId ? { "x-user-id": studentId } : {},
      body: JSON.stringify(payload),
    }),

  // Mentorship Requests
  createMentorshipRequest: (payload, studentId) =>
    request("/mentorship-requests", {
      method: "POST",
      headers: studentId ? { "x-user-id": studentId } : {},
      body: JSON.stringify({ ...payload, studentId }),
    }),
  getMentorshipRequests: (userId, status) => {
    const query = new URLSearchParams({ userId });
    if (status) query.append("status", status);
    return request(`/mentorship-requests?${query.toString()}`);
  },
  updateMentorshipStatus: (requestId, status, actorId) =>
    request(`/mentorship-requests/${requestId}/status`, {
      method: "PATCH",
      headers: actorId ? { "x-user-id": actorId } : {},
      body: JSON.stringify({ status, actorId }),
    }),
  scheduleMentorshipMeeting: (requestId, payload, actorId) =>
    request(`/mentorship-requests/${requestId}/schedule`, {
      method: "PATCH",
      headers: actorId ? { "x-user-id": actorId } : {},
      body: JSON.stringify({ ...payload, actorId }),
    }),

  // Referral Requests
  createReferralRequest: (payload, studentId) =>
    request("/referral-requests", {
      method: "POST",
      headers: studentId ? { "x-user-id": studentId } : {},
      body: JSON.stringify({ ...payload, studentId }),
    }),
  getReferralRequests: (userId, status) => {
    const query = new URLSearchParams({ userId });
    if (status) query.append("status", status);
    return request(`/referral-requests?${query.toString()}`);
  },
  updateReferralStatus: (requestId, status, actorId) =>
    request(`/referral-requests/${requestId}/status`, {
      method: "PATCH",
      headers: actorId ? { "x-user-id": actorId } : {},
      body: JSON.stringify({ status, actorId }),
    }),

  // Chat
  getConversations: (userId) => request(`/chat/conversations?userId=${userId}`),
  createConversation: (actorId, participantId) =>
    request("/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ actorId, participantId }),
    }),
  getMessages: (conversationId, userId, page = 1) =>
    request(`/chat/conversations/${conversationId}/messages?userId=${userId}&page=${page}&limit=50`),
  sendMessage: (conversationId, senderId, text) =>
    request(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ senderId, text }),
    }),

  // Opportunities
  getOpportunities: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== "") query.append(key, val);
    });
    return request(`/opportunities?${query.toString()}`);
  },
  createOpportunity: (payload, postedBy) =>
    request("/opportunities", {
      method: "POST",
      headers: postedBy ? { "x-user-id": postedBy } : {},
      body: JSON.stringify({ ...payload, postedBy }),
    }),
  getOpportunityById: (id) => request(`/opportunities/${id}`),

  // Discussion Forum
  getForumPosts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== "") query.append(key, val);
    });
    return request(`/forum/posts?${query.toString()}`);
  },
  createForumPost: (payload, authorId) =>
    request("/forum/posts", {
      method: "POST",
      headers: authorId ? { "x-user-id": authorId } : {},
      body: JSON.stringify({ ...payload, authorId }),
    }),
  getForumPostById: (id) => request(`/forum/posts/${id}`),
  addComment: (postId, text, authorId) =>
    request(`/forum/posts/${postId}/comments`, {
      method: "POST",
      headers: authorId ? { "x-user-id": authorId } : {},
      body: JSON.stringify({ text, authorId }),
    }),
  getPostComments: (postId, page = 1) =>
    request(`/forum/posts/${postId}/comments?page=${page}&limit=50`),

  // Events
  getEvents: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== "") query.append(key, val);
    });
    return request(`/events?${query.toString()}`);
  },
  createEvent: (payload, organizerId) =>
    request("/events", {
      method: "POST",
      headers: organizerId ? { "x-user-id": organizerId } : {},
      body: JSON.stringify({ ...payload, organizerId }),
    }),
  getEventById: (id) => request(`/events/${id}`),

  // Success Stories
  getSuccessStories: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== "") query.append(key, val);
    });
    return request(`/success-stories?${query.toString()}`);
  },
  createSuccessStory: (payload, authorId) =>
    request("/success-stories", {
      method: "POST",
      headers: authorId ? { "x-user-id": authorId } : {},
      body: JSON.stringify({ ...payload, authorId }),
    }),
  getSuccessStoryById: (id) => request(`/success-stories/${id}`),

  // Reports (Admin Moderation)
  createReport: (payload, reportedBy) =>
    request("/reports", {
      method: "POST",
      headers: reportedBy ? { "x-user-id": reportedBy } : {},
      body: JSON.stringify({ ...payload, reportedBy }),
    }),
  getReports: (adminId, status, targetType) => {
    const query = new URLSearchParams({ adminId });
    if (status) query.append("status", status);
    if (targetType) query.append("targetType", targetType);
    return request(`/reports?${query.toString()}`, {
      headers: { "x-user-id": adminId },
    });
  },
  updateReportStatus: (reportId, status, adminId) =>
    request(`/reports/${reportId}/status`, {
      method: "PATCH",
      headers: { "x-user-id": adminId },
      body: JSON.stringify({ status, adminId }),
    }),
};
