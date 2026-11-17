import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { api, getSessionToken, setSessionToken, resetSocket } from "./services/api";
import { Navbar } from "./components/Navbar";
import { AuthView } from "./components/AuthView";
import { AlumniDirectoryView } from "./components/AlumniDirectoryView";
import { MentorshipView } from "./components/MentorshipView";
import { ReferralHubView } from "./components/ReferralHubView";
import { ChatView } from "./components/ChatView";
import { OpportunitiesView } from "./components/OpportunitiesView";
import { ForumView } from "./components/ForumView";
import { EventsView } from "./components/EventsView";
import { SuccessStoriesView } from "./components/SuccessStoriesView";
import { AdminCenterView } from "./components/AdminCenterView";
import { ProfileView } from "./components/ProfileView";
import { PublicProfileView } from "./components/PublicProfileView";
import {
  MentorshipRequestModal,
  ScheduleMeetingModal,
  ReferralRequestModal,
  PostOpportunityModal,
  AskQuestionModal,
  SubmitStoryModal,
  CreateEventModal,
} from "./components/Modals";

// Route protection guards
// Alumni can only use the app once their profile is complete (the backend enforces the same rule)
const needsProfileCompletion = (user) => Boolean(user) && user.role === "alumni" && !user.profileCompleted && !user.isAdmin;

const RequireAuth = ({ user, children }) => {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (needsProfileCompletion(user) && location.pathname !== "/profile") {
    return <Navigate to="/profile" replace />;
  }
  // If admin tries to access student-only pages, redirect to /admin
  if (
    user.role === "admin" &&
    location.pathname !== "/admin" &&
    location.pathname !== "/events" &&
    !location.pathname.startsWith("/profile")
  ) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

const RequireAdmin = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // isAdmin is set by the server for ADMIN_EMAIL, also when that account is a student or alumni
  if (!user.isAdmin && user.role !== "admin") {
    return <Navigate to="/alumni" replace />;
  }
  return children;
};

const LoginRoute = ({ user, children }) => {
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : needsProfileCompletion(user) ? "/profile" : "/alumni"} replace />;
  }
  return children;
};

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // A cached user is only trusted while a session token exists; /auth/me re-validates it below.
      const saved = localStorage.getItem("alumni_connect_user");
      return saved && getSessionToken() ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const [usersList, setUsersList] = useState([]);
  const [activeChatTarget, setActiveChatTarget] = useState(null);

  // Modals state
  const [mentorshipModal, setMentorshipModal] = useState({ open: false, target: null });
  const [scheduleModal, setScheduleModal] = useState({ open: false, request: null });
  const [referralModal, setReferralModal] = useState({ open: false, target: null, opp: null });
  const [postOppModalOpen, setPostOppModalOpen] = useState(false);
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);

  const handleSelectUser = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("alumni_connect_user", JSON.stringify(user));
    } catch (_) {}
  };

  const clearSession = () => {
    setCurrentUser(null);
    setUsersList([]);
    setSessionToken(null);
    resetSocket();
    try {
      localStorage.removeItem("alumni_connect_user");
    } catch (_) {}
  };

  // Fetch real users list directly from backend (requires a signed-in session)
  const fetchUsers = async () => {
    if (!getSessionToken()) return;
    try {
      const res = await api.getUsers();
      setUsersList(res.data || []);
    } catch (err) {
      console.error("Failed to fetch users from backend:", err);
    }
  };

  // Re-validate the stored session and refresh the profile from the database
  const refreshSession = async () => {
    if (!getSessionToken()) {
      if (currentUser) clearSession();
      return;
    }
    try {
      const res = await api.getMe();
      if (res?.data?.user) handleSelectUser(res.data.user);
    } catch (err) {
      if (err.status === 401 || err.status === 403) clearSession();
    }
  };

  useEffect(() => {
    refreshSession();
    fetchUsers();
  }, []);

  // Any API call rejected with 401 (expired / revoked session) signs the user out
  useEffect(() => {
    const onExpired = () => {
      clearSession();
      navigate("/login");
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  // session = { user, token, isNewUser? } as returned by /auth/google, /auth/login, /auth/register
  const handleAuthSuccess = (session) => {
    const { user, token, isNewUser } = session || {};
    if (!user || !token) return;
    setSessionToken(token);
    resetSocket();
    handleSelectUser(user);
    fetchUsers();
    if (user.role === "admin") navigate("/admin");
    else if (needsProfileCompletion(user) || (isNewUser && user.role === "alumni")) navigate("/profile");
    else navigate("/alumni");
  };

  // Handlers to cross-navigate between views
  const handleStartChat = (alumnus) => {
    setActiveChatTarget(alumnus);
    navigate("/chat");
  };

  const handleOpenMentorship = (alumnus) => {
    setMentorshipModal({ open: true, target: alumnus });
  };

  const handleOpenReferral = (alumnus, opp = null) => {
    setReferralModal({ open: true, target: alumnus, opp });
  };

  const handleScheduleMeeting = (requestItem) => {
    setScheduleModal({ open: true, request: requestItem });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Body with React Router Routes */}
      <main role="main" id="main-content" style={{ flex: 1, paddingBottom: "60px" }}>
        <Routes>
          {/* Public / Auth Route */}
          <Route
            path="/login"
            element={
              <LoginRoute user={currentUser}>
                <AuthView
                  onAuthSuccess={handleAuthSuccess}
                  existingUsers={usersList}
                />
              </LoginRoute>
            }
          />
          <Route path="/auth" element={<Navigate to="/login" replace />} />

          {/* Alumni Directory Route */}
          <Route
            path="/alumni"
            element={
              <RequireAuth user={currentUser}>
                <AlumniDirectoryView
                  currentUser={currentUser}
                  onOpenMentorshipModal={handleOpenMentorship}
                  onOpenReferralModal={(alumnus) => handleOpenReferral(alumnus)}
                  onStartChat={handleStartChat}
                />
              </RequireAuth>
            }
          />

          {/* 1-on-1 Mentorship Lifecycle Route */}
          <Route
            path="/mentorship"
            element={
              <RequireAuth user={currentUser}>
                <MentorshipView
                  currentUser={currentUser}
                  onScheduleMeeting={handleScheduleMeeting}
                  onStartChat={handleStartChat}
                  onOpenNewRequestModal={() => setMentorshipModal({ open: true, target: null })}
                />
              </RequireAuth>
            }
          />

          {/* Referral Tracker Route */}
          <Route
            path="/referrals"
            element={
              <RequireAuth user={currentUser}>
                <ReferralHubView
                  currentUser={currentUser}
                  onRequestReferral={(opp) => handleOpenReferral(opp?.postedBy || null, opp)}
                  onStartChat={handleStartChat}
                />
              </RequireAuth>
            }
          />

          {/* Real-time Socket.io Chat Route */}
          <Route
            path="/chat"
            element={
              <RequireAuth user={currentUser}>
                <ChatView
                  currentUser={currentUser}
                  targetUser={activeChatTarget}
                />
              </RequireAuth>
            }
          />

          {/* Opportunities Board Route */}
          <Route
            path="/opportunities"
            element={
              <RequireAuth user={currentUser}>
                <OpportunitiesView
                  currentUser={currentUser}
                  onOpenPostModal={() => setPostOppModalOpen(true)}
                  onRequestReferral={(opp) => handleOpenReferral(opp?.postedBy || null, opp)}
                />
              </RequireAuth>
            }
          />

          {/* Community Q&A Forum Route */}
          <Route
            path="/forum"
            element={
              <RequireAuth user={currentUser}>
                <ForumView
                  currentUser={currentUser}
                  onOpenAskModal={() => setAskModalOpen(true)}
                />
              </RequireAuth>
            }
          />

          {/* Events & Webinars Route */}
          <Route
            path="/events"
            element={
              <RequireAuth user={currentUser}>
                <EventsView
                  currentUser={currentUser}
                  onOpenCreateEventModal={() => setCreateEventModalOpen(true)}
                />
              </RequireAuth>
            }
          />

          {/* Success Stories Route */}
          <Route
            path="/stories"
            element={
              <RequireAuth user={currentUser}>
                <SuccessStoriesView
                  currentUser={currentUser}
                  onOpenSubmitModal={() => setStoryModalOpen(true)}
                />
              </RequireAuth>
            }
          />

          {/* Protected Admin Center Route */}
          <Route
            path="/admin"
            element={
              <RequireAdmin user={currentUser}>
                <AdminCenterView currentUser={currentUser} />
              </RequireAdmin>
            }
          />

          {/* User Profile & Password Change Route */}
          <Route
            path="/profile"
            element={
              <RequireAuth user={currentUser}>
                <ProfileView
                  currentUser={currentUser}
                  onUserUpdated={(updated) => {
                    handleSelectUser(updated);
                    fetchUsers();
                  }}
                />
              </RequireAuth>
            }
          />

          {/* LinkedIn-Style Public Profile View Route */}
          <Route
            path="/profile/:userId"
            element={
              <RequireAuth user={currentUser}>
                <PublicProfileView
                  currentUser={currentUser}
                  onStartChat={handleStartChat}
                  onOpenMentorshipModal={handleOpenMentorship}
                  onOpenReferralModal={handleOpenReferral}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/u/:userId"
            element={
              <RequireAuth user={currentUser}>
                <PublicProfileView
                  currentUser={currentUser}
                  onStartChat={handleStartChat}
                  onOpenMentorshipModal={handleOpenMentorship}
                  onOpenReferralModal={handleOpenReferral}
                />
              </RequireAuth>
            }
          />

          {/* Root / Catch-all Redirect */}
          <Route
            path="/"
            element={
              <Navigate
                to={!currentUser ? "/login" : currentUser.role === "admin" ? "/admin" : "/alumni"}
                replace
              />
            }
          />
          <Route
            path="*"
            element={
              <Navigate
                to={!currentUser ? "/login" : currentUser.role === "admin" ? "/admin" : "/alumni"}
                replace
              />
            }
          />
        </Routes>
      </main>

      {/* Global Action Modals */}
      <MentorshipRequestModal
        isOpen={mentorshipModal.open}
        onClose={() => setMentorshipModal({ open: false, target: null })}
        mentor={mentorshipModal.target}
        usersList={usersList}
        currentUser={currentUser}
        onSuccess={() => {
          fetchUsers();
          navigate("/mentorship");
        }}
      />

      <ScheduleMeetingModal
        isOpen={scheduleModal.open}
        onClose={() => setScheduleModal({ open: false, request: null })}
        requestItem={scheduleModal.request}
        onSuccess={() => navigate("/mentorship")}
      />

      <ReferralRequestModal
        isOpen={referralModal.open}
        onClose={() => setReferralModal({ open: false, target: null, opp: null })}
        alumnus={referralModal.target}
        opportunity={referralModal.opp}
        usersList={usersList}
        currentUser={currentUser}
        onSuccess={() => {
          fetchUsers();
          navigate("/referrals");
        }}
      />

      <PostOpportunityModal
        isOpen={postOppModalOpen}
        onClose={() => setPostOppModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => navigate("/opportunities")}
      />

      <AskQuestionModal
        isOpen={askModalOpen}
        onClose={() => setAskModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => navigate("/forum")}
      />

      <SubmitStoryModal
        isOpen={storyModalOpen}
        onClose={() => setStoryModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => navigate("/stories")}
      />

      <CreateEventModal
        isOpen={createEventModalOpen}
        onClose={() => setCreateEventModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => navigate("/events")}
      />
    </div>
  );
}

export default App;
