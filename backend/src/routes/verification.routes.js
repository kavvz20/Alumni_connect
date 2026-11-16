import { Router } from "express";
import {
  getVerificationQueue,
  getVerificationDetail,
  decideVerification,
  rescoreOne,
  rescoreAll,
  getMyVerification,
  getModelInfo,
} from "../controllers/verification.controller.js";
import { verifyAuth, requireRole } from "../middleware/auth.middleware.js";

const verificationRouter = Router();
verificationRouter.use(verifyAuth);

verificationRouter.get("/me", getMyVerification);

verificationRouter.get("/", requireRole("admin"), getVerificationQueue);
verificationRouter.post("/rescore-all", requireRole("admin"), rescoreAll);
verificationRouter.get("/model", requireRole("admin"), getModelInfo);
verificationRouter.get("/:userId", requireRole("admin"), getVerificationDetail);
verificationRouter.patch("/:userId", requireRole("admin"), decideVerification);
verificationRouter.post("/:userId/rescore", requireRole("admin"), rescoreOne);

export default verificationRouter;
