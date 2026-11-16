import { Router } from "express";
import { verifyAuth } from "../middleware/auth.middleware.js";
import {
  createConversation,
  createMessage,
  getConversations,
  getMessages,
} from "../controllers/chat.controller.js";

const chatRouter = Router();
chatRouter.use(verifyAuth);

chatRouter
  .route("/conversations")
  .post(createConversation)
  .get(getConversations);
chatRouter
  .route("/conversations/:conversationId/messages")
  .post(createMessage)
  .get(getMessages);

export default chatRouter;
