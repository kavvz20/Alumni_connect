import { Router } from "express";
import {
  createSuccessStory,
  getSuccessStories,
  getSuccessStoryById,
} from "../controllers/success-story.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const successStoryRouter = Router();

successStoryRouter
  .route("/")
  .post(optionalAuth, createSuccessStory)
  .get(getSuccessStories);

successStoryRouter.get("/:storyId", getSuccessStoryById);

export default successStoryRouter;
