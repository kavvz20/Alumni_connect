import { Router } from "express";
import {
  createEvent,
  getEvents,
  getEventById,
} from "../controllers/event.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const eventRouter = Router();

eventRouter
  .route("/")
  .post(optionalAuth, createEvent)
  .get(getEvents);

eventRouter.get("/:eventId", getEventById);

export default eventRouter;
