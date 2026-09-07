import { Router } from "express";
import {
  createReport,
  getReports,
  updateReportStatus,
} from "../controllers/report.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const reportRouter = Router();

reportRouter
  .route("/")
  .post(optionalAuth, createReport)
  .get(optionalAuth, getReports);

reportRouter.patch(
  "/:reportId/status",
  optionalAuth,
  updateReportStatus
);

export default reportRouter;
