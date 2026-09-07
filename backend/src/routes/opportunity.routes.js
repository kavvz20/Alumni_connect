import { Router } from "express";
import {
  createOpportunity,
  getOpportunities,
  getOpportunityById,
} from "../controllers/opportunity.controller.js";

const opportunityRouter = Router();

opportunityRouter.route("/").post(createOpportunity).get(getOpportunities);
opportunityRouter.get("/:opportunityId", getOpportunityById);

export default opportunityRouter;
