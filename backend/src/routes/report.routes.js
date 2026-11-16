import { Router } from "express";
import {
  createReport,
  getReports,
  updateReportStatus,
} from "../controllers/report.controller.js";
import { verifyAuth, requireRole } from "../middleware/auth.middleware.js";

const reportRouter = Router();

reportRouter
  .route("/")
  .post(verifyAuth, createReport)
  .get(verifyAuth, requireRole("admin"), getReports);

reportRouter.patch(
  "/:reportId/status",
  verifyAuth,
  requireRole("admin"),
  updateReportStatus
);

export default reportRouter;
