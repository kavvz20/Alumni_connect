import mongoose from "mongoose";
import { SuccessStory, User } from "../models/index.js";

const isValidId = (id) => mongoose.isValidObjectId(id);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const categories = [
  "placement",
  "internship",
  "career-transition",
  "interview-experience",
];

const createSuccessStory = async (req, res) => {
  try {
    const authorId = req.user?._id || req.body.authorId;
    const { title, story, category } = req.body;

    if (!authorId || !title?.trim() || !story?.trim() || !category) {
      return res.status(400).json({
        success: false,
        message: "authorId, title, story, and category are required.",
      });
    }

    if (!isValidId(authorId)) {
      return res.status(400).json({
        success: false,
        message: "authorId must be a valid ID.",
      });
    }

    if (!categories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `category must be one of: ${categories.join(", ")}.`,
      });
    }

    const author = await User.findById(authorId).select("name role");
    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author user not found.",
      });
    }

    if (author.role === "student") {
      return res.status(403).json({
        success: false,
        message: "Students cannot post success stories. Only alumni and administrators can share success stories.",
      });
    }

    const successStory = await SuccessStory.create({
      authorId,
      title: title.trim(),
      story: story.trim(),
      category,
    });

    await successStory.populate(
      "authorId",
      "name role currentCompany currentRole branch batch linkedinUrl"
    );

    return res.status(201).json({
      success: true,
      message: "Success story posted successfully.",
      data: successStory,
    });
  } catch (error) {
    console.error("Create success story error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create success story.",
    });
  }
};

const getSuccessStories = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
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

    if (category) {
      if (!categories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `category must be one of: ${categories.join(", ")}.`,
        });
      }
      filter.category = category;
    }

    if (search?.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ title: pattern }, { story: pattern }];
    }

    const [stories, total] = await Promise.all([
      SuccessStory.find(filter)
        .populate("authorId", "name role currentCompany currentRole branch batch linkedinUrl")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      SuccessStory.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: stories,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get success stories error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch success stories.",
    });
  }
};

const getSuccessStoryById = async (req, res) => {
  try {
    const { storyId } = req.params;

    if (!isValidId(storyId)) {
      return res.status(400).json({
        success: false,
        message: "storyId must be a valid ID.",
      });
    }

    const story = await SuccessStory.findById(storyId).populate(
      "authorId",
      "name role currentCompany currentRole branch batch linkedinUrl"
    );

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Success story not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: story,
    });
  } catch (error) {
    console.error("Get success story by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch success story.",
    });
  }
};

export { createSuccessStory, getSuccessStories, getSuccessStoryById };
