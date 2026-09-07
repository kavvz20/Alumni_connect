import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { api } from "./services/api";
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
const RequireAuth = ({ user, children }) => {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  // If admin tries to access student-only pages, redirect to /admin
  if (user.role === "admin" && location.pathname !== "/admin" && location.pathname !== "/events" && location.pathname !== "/profile") {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

const RequireAdmin = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== "admin") {
    return <Navigate to="/alumni" replace />;
  }
  return children;
};

const LoginRoute = ({ user, children }) => {
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/alumni"} replace />;
  }
  return children;
};

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("alumni_connect_user");
      return saved ? JSON.parse(saved) : null;
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

  // Fetch real users list directly from backend
  const fetchUsers = async () => {
    try {
      const res = await api.getUsers();
      const list = res.data || [];
      setUsersList(list);

      // If user is already logged in, refresh profile data from database
      if (currentUser) {
        const refreshed = list.find((u) => u._id === currentUser._id);
        if (refreshed) {
          handleSelectUser(refreshed);
        }
      }
    } catch (err) {
      console.error("Failed to fetch users from backend:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("alumni_connect_user", JSON.stringify(user));
    } catch (_) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("alumni_connect_user");
    } catch (_) {}
    navigate("/login");
  };

  const handleAuthSuccess = (user) => {
    handleSelectUser(user);
    fetchUsers();
    navigate(user.role === "admin" ? "/admin" : "/alumni");
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
      <main style={{ flex: 1, paddingBottom: "60px" }}>
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
                  onRequestReferral={(opp) => handleOpenReferral(null, opp)}
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
                  onRequestReferral={(opp) => handleOpenReferral(null, opp)}
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
                    setCurrentUser(updated);
                    localStorage.setItem("alumni_user", JSON.stringify(updated));
                  }}
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
        currentUser={currentUser}
        onSuccess={() => navigate("/mentorship")}
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
        currentUser={currentUser}
        onSuccess={() => navigate("/referrals")}
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
