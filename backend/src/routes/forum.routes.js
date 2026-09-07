import { Router } from "express";
import {
  createForumPost,
  getForumPosts,
  getForumPostById,
  addComment,
  getPostComments,
} from "../controllers/forum.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const forumRouter = Router();

forumRouter
  .route("/posts")
  .post(optionalAuth, createForumPost)
  .get(getForumPosts);

forumRouter.get("/posts/:postId", getForumPostById);

forumRouter
  .route("/posts/:postId/comments")
  .post(optionalAuth, addComment)
  .get(getPostComments);

export default forumRouter;
