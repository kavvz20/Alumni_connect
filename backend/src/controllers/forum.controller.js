import mongoose from "mongoose";
import { ForumPost, Comment, User } from "../models/index.js";

const isValidId = (id) => mongoose.isValidObjectId(id);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createForumPost = async (req, res) => {
  try {
    const authorId = req.user?._id || req.body.authorId;
    const { question, tags } = req.body;

    if (!authorId || !question?.trim()) {
      return res.status(400).json({
        success: false,
        message: "authorId and question are required.",
      });
    }

    if (!isValidId(authorId)) {
      return res.status(400).json({
        success: false,
        message: "authorId must be a valid ID.",
      });
    }

    const author = await User.findById(authorId).select("role name");
    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author not found.",
      });
    }

    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags.map((t) => t.trim()).filter(Boolean);
    } else if (typeof tags === "string") {
      parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    }

    const post = await ForumPost.create({
      authorId,
      question: question.trim(),
      tags: parsedTags,
    });

    await post.populate("authorId", "name role branch batch currentCompany currentRole");

    return res.status(201).json({
      success: true,
      message: "Forum post created successfully.",
      data: post,
    });
  } catch (error) {
    console.error("Create forum post error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create forum post.",
    });
  }
};

const getForumPosts = async (req, res) => {
  try {
    const { tag, search, page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(limit);

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

    const filter = {};

    if (tag?.trim()) {
      filter.tags = new RegExp(`^${escapeRegex(tag.trim())}$`, "i");
    }

    if (search?.trim()) {
      filter.question = new RegExp(escapeRegex(search.trim()), "i");
    }

    const [posts, total] = await Promise.all([
      ForumPost.find(filter)
        .populate("authorId", "name role branch batch currentCompany currentRole")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      ForumPost.countDocuments(filter),
    ]);

    // Attach comment counts
    const postIds = posts.map((p) => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(commentCounts.map((c) => [c._id.toString(), c.count]));

    const postsWithCounts = posts.map((post) => ({
      ...post.toObject(),
      commentCount: countMap.get(post._id.toString()) || 0,
    }));

    return res.status(200).json({
      success: true,
      data: postsWithCounts,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get forum posts error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch forum posts.",
    });
  }
};

const getForumPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!isValidId(postId)) {
      return res.status(400).json({
        success: false,
        message: "postId must be a valid ID.",
      });
    }

    const post = await ForumPost.findById(postId).populate(
      "authorId",
      "name role branch batch currentCompany currentRole"
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Forum post not found.",
      });
    }

    const commentCount = await Comment.countDocuments({ postId });

    return res.status(200).json({
      success: true,
      data: {
        ...post.toObject(),
        commentCount,
      },
    });
  } catch (error) {
    console.error("Get forum post by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch forum post.",
    });
  }
};

const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const authorId = req.user?._id || req.body.authorId;
    const { text } = req.body;

    if (!isValidId(postId) || !authorId || !text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "postId, authorId, and text are required.",
      });
    }

    if (!isValidId(authorId)) {
      return res.status(400).json({
        success: false,
        message: "authorId must be a valid ID.",
      });
    }

    const [post, author] = await Promise.all([
      ForumPost.findById(postId),
      User.findById(authorId).select("name role"),
    ]);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Forum post not found.",
      });
    }

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author not found.",
      });
    }

    if (author.role === "student") {
      return res.status(403).json({
        success: false,
        message: "Students cannot answer forum questions. Answers are reserved for alumni mentors and administrators.",
      });
    }

    const comment = await Comment.create({
      postId,
      authorId,
      text: text.trim(),
    });

    await comment.populate(
      "authorId",
      "name role currentCompany currentRole branch batch"
    );

    return res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      data: comment,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to add comment.",
    });
  }
};

const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (!isValidId(postId)) {
      return res.status(400).json({
        success: false,
        message: "postId must be a valid ID.",
      });
    }

    const [comments, total] = await Promise.all([
      Comment.find({ postId })
        .populate("authorId", "name role currentCompany currentRole branch batch")
        .sort({ createdAt: 1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Comment.countDocuments({ postId }),
    ]);

    return res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch comments.",
    });
  }
};

export {
  createForumPost,
  getForumPosts,
  getForumPostById,
  addComment,
  getPostComments,
};
