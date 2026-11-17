import { Router } from "express";
import {
  createReport,
  getReports,
  updateReportStatus,
} from "../controllers/report.controller.js";
import { verifyAuth, requireRole, requireCompleteProfile } from "../middleware/auth.middleware.js";

const reportRouter = Router();

reportRouter
  .route("/")
  .post(verifyAuth, requireCompleteProfile, createReport)
  .get(verifyAuth, requireCompleteProfile, requireRole("admin"), getReports);

reportRouter.patch(
  "/:reportId/status",
  verifyAuth, requireCompleteProfile,
  requireRole("admin"),
  updateReportStatus
);

export default reportRouter;
