import { Router } from "express";
import {
  createMentorshipRequest,
  getMentorshipRequests,
  updateMentorshipRequestStatus,
  scheduleMentorshipMeeting,
} from "../controllers/mentorship-request.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const mentorshipRequestRouter = Router();

mentorshipRequestRouter
  .route("/")
  .post(optionalAuth, createMentorshipRequest)
  .get(optionalAuth, getMentorshipRequests);

mentorshipRequestRouter.patch(
  "/:requestId/status",
  optionalAuth,
  updateMentorshipRequestStatus
);

mentorshipRequestRouter.patch(
  "/:requestId/schedule",
  optionalAuth,
  scheduleMentorshipMeeting
);

export default mentorshipRequestRouter;
