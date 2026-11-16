import { Router } from "express";
import {
  createReferralRequest,
  getReferralRequests,
  updateReferralRequestStatus,
} from "../controllers/referral-request.controller.js";
import { verifyAuth } from "../middleware/auth.middleware.js";

const referralRequestRouter = Router();

referralRequestRouter
  .route("/")
  .post(verifyAuth, createReferralRequest)
  .get(verifyAuth, getReferralRequests);

referralRequestRouter.patch(
  "/:requestId/status",
  verifyAuth,
  updateReferralRequestStatus
);

export default referralRequestRouter;
