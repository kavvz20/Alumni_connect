import mongoose from "mongoose";
import { Conversation, Message, User } from "../models/index.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

const isConversationParticipant = (conversation, userId) =>
  conversation.participantOneId.equals(userId) ||
  conversation.participantTwoId.equals(userId);

const createConversation = async (req, res) => {
  try {
    const { actorId, participantId } = req.body;

    if (
      !actorId ||
      !participantId ||
      !isValidId(actorId) ||
      !isValidId(participantId)
    ) {
      return res.status(400).json({
        success: false,
        message: "actorId and participantId must be valid user IDs.",
      });
    }

    if (actorId === participantId) {
      return res.status(400).json({
        success: false,
        message: "You cannot create a conversation with yourself.",
      });
    }

    const [actor, participant] = await Promise.all([
      User.findById(actorId),
      User.findById(participantId),
    ]);

    if (!actor || !participant) {
      return res
        .status(404)
        .json({ success: false, message: "One or both users were not found." });
    }

    const [participantOneId, participantTwoId] = [
      actorId,
      participantId,
    ].sort();
    let conversation = await Conversation.findOne({
      participantOneId,
      participantTwoId,
    });

    if (conversation) {
      return res.status(200).json({
        success: true,
        message: "Conversation already exists.",
        data: conversation,
      });
    }

    try {
      conversation = await Conversation.create({
        participantOneId,
        participantTwoId,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;

      conversation = await Conversation.findOne({
        participantOneId,
        participantTwoId,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Conversation created successfully.",
      data: conversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to create the conversation." });
  }
};

const getConversations = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || !isValidId(userId)) {
      return res.status(400).json({
        success: false,
        message: "A valid userId query parameter is required.",
      });
    }

    const user = await User.findById(userId).select("_id");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    const conversations = await Conversation.find({
      $or: [{ participantOneId: user._id }, { participantTwoId: user._id }],
    })
      .populate("participantOneId", "name role currentCompany currentRole")
      .populate("participantTwoId", "name role currentCompany currentRole")
      .sort({ createdAt: -1 });

    const validConversations = conversations.filter((c) => c.participantOneId && c.participantTwoId);
    return res.status(200).json({ success: true, data: validConversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch conversations." });
  }
};

const createMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { senderId, text } = req.body;

    if (!isValidId(conversationId) || !isValidId(senderId) || !text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "conversationId, senderId, and non-empty text are required.",
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found." });

    if (!isConversationParticipant(conversation, senderId)) {
      return res.status(403).json({
        success: false,
        message: "Only conversation participants can send messages.",
      });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      text: text.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: message,
    });
  } catch (error) {
    console.error("Create message error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to send the message." });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, page = 1, limit = 50 } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (!isValidId(conversationId) || !isValidId(userId)) {
      return res.status(400).json({
        success: false,
        message: "conversationId and userId must be valid IDs.",
      });
    }

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "page must be at least 1 and limit must be between 1 and 100.",
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found." });

    if (!isConversationParticipant(conversation, userId)) {
      return res.status(403).json({
        success: false,
        message: "Only conversation participants can view messages.",
      });
    }

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .populate("senderId", "name role")
        .sort({ sentAt: 1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Message.countDocuments({ conversationId }),
    ]);

    return res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch messages." });
  }
};

export { createConversation, createMessage, getConversations, getMessages };
