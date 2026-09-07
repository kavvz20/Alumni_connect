import mongoose from "mongoose";
import { Conversation, Message } from "../models/index.js";

const roomName = (conversationId) => `conversation:${conversationId}`;
const isValidId = (id) => mongoose.isValidObjectId(id);

const respond = (callback, payload) => {
  if (typeof callback === "function") callback(payload);
};

const getParticipantConversation = async (conversationId, userId) => {
  if (!isValidId(conversationId) || !isValidId(userId)) return null;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return null;

  const isParticipant =
    conversation.participantOneId.equals(userId) ||
    conversation.participantTwoId.equals(userId);
  return isParticipant ? conversation : null;
};

const initializeChatSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on(
      "join-conversation",
      async ({ conversationId, userId }, callback) => {
        try {
          const conversation = await getParticipantConversation(
            conversationId,
            userId
          );

          if (!conversation) {
            return respond(callback, {
              success: false,
              message: "You cannot join this conversation.",
            });
          }

          socket.join(roomName(conversationId));
          return respond(callback, {
            success: true,
            message: "Joined conversation.",
          });
        } catch (error) {
          console.error("Join conversation socket error:", error);
          return respond(callback, {
            success: false,
            message: "Unable to join the conversation.",
          });
        }
      }
    );

    socket.on(
      "send-message",
      async ({ conversationId, senderId, text }, callback) => {
        try {
          if (!text?.trim()) {
            return respond(callback, {
              success: false,
              message: "Message text is required.",
            });
          }

          const conversation = await getParticipantConversation(
            conversationId,
            senderId
          );

          if (!conversation) {
            return respond(callback, {
              success: false,
              message: "Only conversation participants can send messages.",
            });
          }

          const message = await Message.create({
            conversationId,
            senderId,
            text: text.trim(),
          });
          await message.populate("senderId", "name role");

          socket.to(roomName(conversationId)).emit("receive-message", message);
          return respond(callback, { success: true, data: message });
        } catch (error) {
          console.error("Send message socket error:", error);
          return respond(callback, {
            success: false,
            message: "Unable to send the message.",
          });
        }
      }
    );
  });
};

export { initializeChatSocket };
