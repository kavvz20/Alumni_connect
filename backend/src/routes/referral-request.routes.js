import { Router } from "express";
import {
  createReferralRequest,
  getReferralRequests,
  updateReferralRequestStatus,
} from "../controllers/referral-request.controller.js";
import { verifyAuth, requireCompleteProfile } from "../middleware/auth.middleware.js";

const referralRequestRouter = Router();

referralRequestRouter
  .route("/")
  .post(verifyAuth, requireCompleteProfile, createReferralRequest)
  .get(verifyAuth, requireCompleteProfile, getReferralRequests);

referralRequestRouter.patch(
  "/:requestId/status",
  verifyAuth, requireCompleteProfile,
  updateReferralRequestStatus
);

export default referralRequestRouter;
