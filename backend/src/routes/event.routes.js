import { Router } from "express";
import {
  createEvent,
  getEvents,
  getEventById,
} from "../controllers/event.controller.js";
import { verifyAuth } from "../middleware/auth.middleware.js";

const eventRouter = Router();

eventRouter
  .route("/")
  .post(verifyAuth, createEvent)
  .get(getEvents);

eventRouter.get("/:eventId", getEventById);

export default eventRouter;
