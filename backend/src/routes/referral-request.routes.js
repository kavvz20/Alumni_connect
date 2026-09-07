import { Router } from "express";
import {
  createReferralRequest,
  getReferralRequests,
  updateReferralRequestStatus,
} from "../controllers/referral-request.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const referralRequestRouter = Router();

referralRequestRouter
  .route("/")
  .post(optionalAuth, createReferralRequest)
  .get(optionalAuth, getReferralRequests);

referralRequestRouter.patch(
  "/:requestId/status",
  optionalAuth,
  updateReferralRequestStatus
);

export default referralRequestRouter;
