import { Router } from "express";
import {
  createEvent,
  getEvents,
  getEventById,
} from "../controllers/event.controller.js";
import { verifyAuth, requireCompleteProfile } from "../middleware/auth.middleware.js";

const eventRouter = Router();

eventRouter
  .route("/")
  .post(verifyAuth, requireCompleteProfile, createEvent)
  .get(getEvents);

eventRouter.get("/:eventId", getEventById);

export default eventRouter;
