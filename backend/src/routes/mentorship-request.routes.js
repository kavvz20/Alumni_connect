import { Router } from "express";
import {
  createMentorshipRequest,
  getMentorshipRequests,
  updateMentorshipRequestStatus,
  scheduleMentorshipMeeting,
} from "../controllers/mentorship-request.controller.js";
import { verifyAuth } from "../middleware/auth.middleware.js";

const mentorshipRequestRouter = Router();

mentorshipRequestRouter
  .route("/")
  .post(verifyAuth, createMentorshipRequest)
  .get(verifyAuth, getMentorshipRequests);

mentorshipRequestRouter.patch(
  "/:requestId/status",
  verifyAuth,
  updateMentorshipRequestStatus
);

mentorshipRequestRouter.patch(
  "/:requestId/schedule",
  verifyAuth,
  scheduleMentorshipMeeting
);

export default mentorshipRequestRouter;
