import mongoose from "mongoose";
import { MentorshipMeetingRequest, User } from "../models/index.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

const createMentorshipRequest = async (req, res) => {
  try {
    const studentId = req.user?._id || req.headers["x-user-id"] || req.body.studentId;
    const { alumniId, agenda } = req.body;

    if (!studentId || !alumniId || !agenda?.trim()) {
      return res.status(400).json({
        success: false,
        message: "studentId, alumniId, and agenda are required.",
      });
    }

    if (!isValidId(studentId) || !isValidId(alumniId)) {
      return res.status(400).json({
        success: false,
        message: "studentId and alumniId must be valid user IDs.",
      });
    }

    if (studentId.toString() === alumniId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot request mentorship from yourself.",
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

    if (!alumni.availableForMentorshipCalls) {
      return res.status(400).json({
        success: false,
        message:
          "This alumnus is not currently available for mentorship calls.",
      });
    }

    const request = await MentorshipMeetingRequest.create({
      studentId,
      alumniId,
      agenda: agenda.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Mentorship request sent successfully.",
      data: request,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An active mentorship request already exists for this student and alumnus.",
      });
    }

    console.error("Create mentorship request error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create the mentorship request.",
    });
  }
};

const getMentorshipRequests = async (req, res) => {
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
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    let filter = {};
    if (user.role === "student") {
      filter.studentId = user._id;
    } else if (user.role === "alumni") {
      filter.alumniId = user._id;
    }
    // If admin, can view all or filter by status
    if (status) filter.status = status;

    const requests = await MentorshipMeetingRequest.find(filter)
      .populate("studentId", "name email branch batch resumeUrl")
      .populate("alumniId", "name email currentCompany currentRole linkedinUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Get mentorship requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch mentorship requests.",
    });
  }
};

const updateMentorshipRequestStatus = async (req, res) => {
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

    if (!["accepted", "rejected", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be accepted, rejected, cancelled, or completed.",
      });
    }

    const [request, actor] = await Promise.all([
      MentorshipMeetingRequest.findById(requestId),
      User.findById(actorId).select("role"),
    ]);

    if (!request || !actor) {
      return res
        .status(404)
        .json({ success: false, message: "Request or user not found." });
    }

    const isStudent = request.studentId.equals(actor._id);
    const isAlumni = request.alumniId.equals(actor._id);

    if (
      (status === "accepted" || status === "rejected") &&
      (request.status !== "pending" || !isAlumni || actor.role !== "alumni")
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the target alumnus can accept or reject a pending request.",
      });
    }

    if (
      status === "cancelled" &&
      (request.status !== "pending" || !isStudent || actor.role !== "student")
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the requesting student can cancel a pending request.",
      });
    }

    if (
      status === "completed" &&
      (request.status !== "accepted" || (!isStudent && !isAlumni))
    ) {
      return res.status(403).json({
        success: false,
        message: "Only participants can complete an accepted request.",
      });
    }

    request.status = status;
    await request.save();

    return res.status(200).json({
      success: true,
      message: `Mentorship request ${status}.`,
      data: request,
    });
  } catch (error) {
    console.error("Update mentorship request error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update the mentorship request.",
    });
  }
};

/**
 * Schedule Google Meet / Calendar slot for an accepted mentorship request
 * Reference: Data Model Section 2
 */
const scheduleMentorshipMeeting = async (req, res) => {
  try {
    const { requestId } = req.params;
    const actorId = req.user?._id || req.body.actorId;
    const { meetingScheduledAt, meetingLink, googleCalendarEventId } = req.body;

    if (!isValidId(requestId) || !isValidId(actorId)) {
      return res.status(400).json({
        success: false,
        message: "requestId and actorId must be valid IDs.",
      });
    }

    if (!meetingScheduledAt || !meetingLink) {
      return res.status(400).json({
        success: false,
        message: "meetingScheduledAt and meetingLink are required.",
      });
    }

    const request = await MentorshipMeetingRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Mentorship request not found.",
      });
    }

    const isStudent = request.studentId.equals(actorId);
    const isAlumni = request.alumniId.equals(actorId);

    if (!isStudent && !isAlumni) {
      return res.status(403).json({
        success: false,
        message: "Only participants can schedule this meeting.",
      });
    }

    if (request.status !== "accepted" && request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Meetings can only be scheduled for pending or accepted requests.",
      });
    }

    // Auto-accept if alumnus is scheduling
    if (request.status === "pending" && isAlumni) {
      request.status = "accepted";
    }

    request.meetingScheduledAt = new Date(meetingScheduledAt);
    request.meetingLink = meetingLink;
    if (googleCalendarEventId) {
      request.googleCalendarEventId = googleCalendarEventId;
    }

    await request.save();

    return res.status(200).json({
      success: true,
      message: "Mentorship meeting scheduled successfully.",
      data: request,
    });
  } catch (error) {
    console.error("Schedule mentorship meeting error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to schedule mentorship meeting.",
    });
  }
};

export {
  createMentorshipRequest,
  getMentorshipRequests,
  updateMentorshipRequestStatus,
  scheduleMentorshipMeeting,
};
