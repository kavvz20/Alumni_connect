import { Router } from "express";
import { verifyAuth } from "../middleware/auth.middleware.js";
import {
  createOpportunity,
  getOpportunities,
  getOpportunityById,
} from "../controllers/opportunity.controller.js";

const opportunityRouter = Router();

opportunityRouter.route("/").post(verifyAuth, createOpportunity).get(getOpportunities);
opportunityRouter.get("/:opportunityId", getOpportunityById);

export default opportunityRouter;
