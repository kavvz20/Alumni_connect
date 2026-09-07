import mongoose from "mongoose";
import { ReferralRequest, User, Opportunity } from "../models/index.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

const createReferralRequest = async (req, res) => {
  try {
    const studentId = req.user?._id || req.headers["x-user-id"] || req.body.studentId;
    const {
      alumniId,
      opportunityId,
      companyName,
      jobId,
      jobLink,
      email,
      resumeUrl,
    } = req.body;

    if (
      !studentId ||
      !alumniId ||
      !companyName?.trim() ||
      !jobId?.trim() ||
      !jobLink?.trim() ||
      !email?.trim() ||
      !resumeUrl?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "studentId, alumniId, companyName, jobId, jobLink, email, and resumeUrl are required.",
      });
    }

    if (!isValidId(studentId) || !isValidId(alumniId)) {
      return res.status(400).json({
        success: false,
        message: "studentId and alumniId must be valid IDs.",
      });
    }

    if (studentId.toString() === alumniId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot request a referral from yourself.",
      });
    }

    const [student, alumni] = await Promise.all([
      User.findById(studentId),
      User.findById(alumniId),
    ]);

    if (!student || student.role !== "student") {
      return res.status(400).json({
        success: false,
        message: "studentId must belong to a student user.",
      });
    }

    if (!alumni || alumni.role !== "alumni") {
      return res.status(400).json({
        success: false,
        message: "alumniId must belong to an alumni user.",
      });
    }

    if (!alumni.willingToRefer) {
      return res.status(400).json({
        success: false,
        message: "This alumnus is not currently opted in to give referrals.",
      });
    }

    if (opportunityId) {
      if (!isValidId(opportunityId)) {
        return res.status(400).json({
          success: false,
          message: "opportunityId must be a valid ID.",
        });
      }
      const opp = await Opportunity.findById(opportunityId);
      if (!opp) {
        return res.status(404).json({
          success: false,
          message: "Opportunity not found.",
        });
      }
    }

    const referralRequest = await ReferralRequest.create({
      studentId,
      alumniId,
      opportunityId: opportunityId || undefined,
      companyName: companyName.trim(),
      jobId: jobId.trim(),
      jobLink: jobLink.trim(),
      email: email.trim().toLowerCase(),
      resumeUrl: resumeUrl.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Referral request submitted successfully.",
      data: referralRequest,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An active referral request already exists for this student, alumnus, and job ID.",
      });
    }

    console.error("Create referral request error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit referral request.",
    });
  }
};

const getReferralRequests = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;
    const { status } = req.query;

    if (!userId || !isValidId(userId)) {
      return res.status(400).json({
        success: false,
        message: "A valid userId query parameter is required.",
      });
    }

    const user = await User.findById(userId).select("role");
    if (!user || !["student", "alumni", "admin"].includes(user.role)) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let filter = {};
    if (user.role === "student") {
      filter.studentId = user._id;
    } else if (user.role === "alumni") {
      filter.alumniId = user._id;
    }

    if (status) {
      if (!["pending", "approved", "rejected", "cancelled"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter.",
        });
      }
      filter.status = status;
    }

    const requests = await ReferralRequest.find(filter)
      .populate("studentId", "name email branch batch resumeUrl")
      .populate("alumniId", "name email currentCompany currentRole linkedinUrl")
      .populate("opportunityId", "title company type applyLink")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get referral requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch referral requests.",
    });
  }
};

const updateReferralRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const actorId = req.user?._id || req.body.actorId;
    const { status } = req.body;

    if (!isValidId(requestId) || !isValidId(actorId)) {
      return res.status(400).json({
        success: false,
        message: "requestId and actorId must be valid IDs.",
      });
    }

    if (!["approved", "rejected", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be approved, rejected, or cancelled.",
      });
    }

    const [request, actor] = await Promise.all([
      ReferralRequest.findById(requestId),
      User.findById(actorId).select("role"),
    ]);

    if (!request || !actor) {
      return res.status(404).json({
        success: false,
        message: "Request or user not found.",
      });
    }

    const isStudent = request.studentId.equals(actor._id);
    const isAlumni = request.alumniId.equals(actor._id);

    if (
      (status === "approved" || status === "rejected") &&
      (request.status !== "pending" || !isAlumni || actor.role !== "alumni")
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the target alumnus can approve or reject a pending referral request.",
      });
    }

    if (
      status === "cancelled" &&
      (request.status !== "pending" || !isStudent || actor.role !== "student")
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the requesting student can cancel a pending referral request.",
      });
    }

    request.status = status;
    await request.save();

    return res.status(200).json({
      success: true,
      message: `Referral request ${status}.`,
      data: request,
    });
  } catch (error) {
    console.error("Update referral request error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update referral request.",
    });
  }
};

export {
  createReferralRequest,
  getReferralRequests,
  updateReferralRequestStatus,
};
