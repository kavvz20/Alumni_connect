import mongoose from "mongoose";
import { Report, User } from "../models/index.js";

const isValidId = (id) => mongoose.isValidObjectId(id);
const targetTypes = ["user", "forumPost", "comment", "opportunity"];
const statuses = ["open", "reviewed", "dismissed"];

const createReport = async (req, res) => {
  try {
    const reportedBy = req.user?._id || req.body.reportedBy;
    const { targetType, targetId, reason } = req.body;

    if (!reportedBy || !targetType || !targetId || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "reportedBy, targetType, targetId, and reason are required.",
      });
    }

    if (!isValidId(reportedBy) || !isValidId(targetId)) {
      return res.status(400).json({
        success: false,
        message: "reportedBy and targetId must be valid IDs.",
      });
    }

    if (!targetTypes.includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: `targetType must be one of: ${targetTypes.join(", ")}.`,
      });
    }

    const reporter = await User.findById(reportedBy).select("role name");
    if (!reporter) {
      return res.status(404).json({
        success: false,
        message: "Reporting user not found.",
      });
    }

    const report = await Report.create({
      reportedBy,
      targetType,
      targetId,
      reason: reason.trim(),
    });

    await report.populate("reportedBy", "name email role");

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully. Content will be reviewed by administrators.",
      data: report,
    });
  } catch (error) {
    console.error("Create report error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit report.",
    });
  }
};

const getReports = async (req, res) => {
  try {
    const adminId = req.user?._id || req.query.adminId;
    const { status, targetType, page = 1, limit = 20 } = req.query;
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

    // Verify admin access
    if (req.user?.role !== "admin") {
      if (!adminId || !isValidId(adminId)) {
        return res.status(403).json({
          success: false,
          message: "Admin authentication required.",
        });
      }
      const admin = await User.findById(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access restricted to administrators.",
        });
      }
    }

    const filter = {};
    if (status && statuses.includes(status)) {
      filter.status = status;
    }
    if (targetType && targetTypes.includes(targetType)) {
      filter.targetType = targetType;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate("reportedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Report.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get reports error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch reports.",
    });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const adminId = req.user?._id || req.body.adminId;
    const { status } = req.body;

    if (!isValidId(reportId)) {
      return res.status(400).json({
        success: false,
        message: "reportId must be a valid ID.",
      });
    }

    if (!statuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${statuses.join(", ")}.`,
      });
    }

    // Verify admin access
    if (req.user?.role !== "admin") {
      if (!adminId || !isValidId(adminId)) {
        return res.status(403).json({
          success: false,
          message: "Admin authentication required.",
        });
      }
      const admin = await User.findById(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access restricted to administrators.",
        });
      }
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    report.status = status;
    await report.save();

    return res.status(200).json({
      success: true,
      message: `Report status updated to ${status}.`,
      data: report,
    });
  } catch (error) {
    console.error("Update report status error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update report status.",
    });
  }
};

export { createReport, getReports, updateReportStatus };
