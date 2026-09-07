import mongoose from "mongoose";
import { Opportunity, User } from "../models/index.js";

const opportunityTypes = [
  "internship",
  "job",
  "hackathon",
  "referral",
  "workshop",
];
const isValidId = (id) => mongoose.isValidObjectId(id);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createOpportunity = async (req, res) => {
  try {
    const { postedBy, type, title, description, applyLink, company } = req.body;

    if (!postedBy || !type || !title?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "postedBy, type, title, and description are required.",
      });
    }

    if (!isValidId(postedBy)) {
      return res
        .status(400)
        .json({ success: false, message: "postedBy must be a valid user ID." });
    }

    if (!opportunityTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `type must be one of: ${opportunityTypes.join(", ")}.`,
      });
    }

    const alumni = await User.findById(postedBy).select("role");
    if (!alumni || alumni.role !== "alumni") {
      return res.status(403).json({
        success: false,
        message: "Only alumni users can post opportunities.",
      });
    }

    const opportunity = await Opportunity.create({
      postedBy,
      type,
      title: title.trim(),
      description: description.trim(),
      applyLink,
      company: company?.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Opportunity posted successfully.",
      data: opportunity,
    });
  } catch (error) {
    console.error("Create opportunity error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to post the opportunity." });
  }
};

const getOpportunities = async (req, res) => {
  try {
    const { type, company, search, page = 1, limit = 10 } = req.query;
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

    if (type) {
      if (!opportunityTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `type must be one of: ${opportunityTypes.join(", ")}.`,
        });
      }
      filter.type = type;
    }

    if (company?.trim())
      filter.company = new RegExp(`^${escapeRegex(company.trim())}$`, "i");

    if (search?.trim()) {
      const searchPattern = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [
        { title: searchPattern },
        { description: searchPattern },
        { company: searchPattern },
      ];
    }

    const [opportunities, total] = await Promise.all([
      Opportunity.find(filter)
        .populate("postedBy", "name currentCompany currentRole")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Opportunity.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: opportunities,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get opportunities error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch opportunities." });
  }
};

const getOpportunityById = async (req, res) => {
  try {
    const { opportunityId } = req.params;

    if (!isValidId(opportunityId)) {
      return res
        .status(400)
        .json({ success: false, message: "opportunityId must be a valid ID." });
    }

    const opportunity = await Opportunity.findById(opportunityId).populate(
      "postedBy",
      "name currentCompany currentRole linkedinUrl"
    );

    if (!opportunity)
      return res
        .status(404)
        .json({ success: false, message: "Opportunity not found." });

    return res.status(200).json({ success: true, data: opportunity });
  } catch (error) {
    console.error("Get opportunity error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch the opportunity." });
  }
};

export { createOpportunity, getOpportunities, getOpportunityById };
