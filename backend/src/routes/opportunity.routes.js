import { Router } from "express";
import { verifyAuth, requireCompleteProfile } from "../middleware/auth.middleware.js";
import {
  createOpportunity,
  getOpportunities,
  getOpportunityById,
} from "../controllers/opportunity.controller.js";

const opportunityRouter = Router();

opportunityRouter.route("/").post(verifyAuth, requireCompleteProfile, createOpportunity).get(getOpportunities);
opportunityRouter.get("/:opportunityId", getOpportunityById);

export default opportunityRouter;
