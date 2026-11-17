import { Router } from "express";
import {
  createMentorshipRequest,
  getMentorshipRequests,
  updateMentorshipRequestStatus,
  scheduleMentorshipMeeting,
} from "../controllers/mentorship-request.controller.js";
import { verifyAuth, requireCompleteProfile } from "../middleware/auth.middleware.js";

const mentorshipRequestRouter = Router();

mentorshipRequestRouter
  .route("/")
  .post(verifyAuth, requireCompleteProfile, createMentorshipRequest)
  .get(verifyAuth, requireCompleteProfile, getMentorshipRequests);

mentorshipRequestRouter.patch(
  "/:requestId/status",
  verifyAuth, requireCompleteProfile,
  updateMentorshipRequestStatus
);

mentorshipRequestRouter.patch(
  "/:requestId/schedule",
  verifyAuth, requireCompleteProfile,
  scheduleMentorshipMeeting
);

export default mentorshipRequestRouter;
