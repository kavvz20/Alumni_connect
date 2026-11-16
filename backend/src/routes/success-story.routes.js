import { Router } from "express";
import {
  createSuccessStory,
  getSuccessStories,
  getSuccessStoryById,
} from "../controllers/success-story.controller.js";
import { verifyAuth } from "../middleware/auth.middleware.js";

const successStoryRouter = Router();

successStoryRouter
  .route("/")
  .post(verifyAuth, createSuccessStory)
  .get(getSuccessStories);

successStoryRouter.get("/:storyId", getSuccessStoryById);

export default successStoryRouter;
