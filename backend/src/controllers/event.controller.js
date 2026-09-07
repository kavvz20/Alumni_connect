import mongoose from "mongoose";
import { Event, User } from "../models/index.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

const createEvent = async (req, res) => {
  try {
    const organizerId = req.user?._id || req.body.organizerId;
    const { title, description, eventDate, mode = "online", link } = req.body;

    if (!organizerId || !title?.trim() || !eventDate) {
      return res.status(400).json({
        success: false,
        message: "organizerId, title, and eventDate are required.",
      });
    }

    if (!isValidId(organizerId)) {
      return res.status(400).json({
        success: false,
        message: "organizerId must be a valid ID.",
      });
    }

    if (!["online", "offline"].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "mode must be either online or offline.",
      });
    }

    const organizer = await User.findById(organizerId).select("name role");
    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: "Organizer user not found.",
      });
    }

    if (organizer.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can organize events.",
      });
    }

    const event = await Event.create({
      organizerId,
      title: title.trim(),
      description: description?.trim(),
      eventDate: new Date(eventDate),
      mode,
      link: mode === "online" ? link?.trim() : undefined,
    });

    await event.populate("organizerId", "name role currentCompany currentRole");

    return res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create event.",
    });
  }
};

const getEvents = async (req, res) => {
  try {
    const { mode, timeframe, page = 1, limit = 10 } = req.query;
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

    if (mode && ["online", "offline"].includes(mode)) {
      filter.mode = mode;
    }

    let sort = { eventDate: 1 };

    if (timeframe === "upcoming") {
      filter.eventDate = { $gte: new Date() };
      sort = { eventDate: 1 };
    } else if (timeframe === "past") {
      filter.eventDate = { $lt: new Date() };
      sort = { eventDate: -1 };
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("organizerId", "name role currentCompany currentRole")
        .sort(sort)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Event.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: events,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get events error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch events.",
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!isValidId(eventId)) {
      return res.status(400).json({
        success: false,
        message: "eventId must be a valid ID.",
      });
    }

    const event = await Event.findById(eventId).populate(
      "organizerId",
      "name role currentCompany currentRole email"
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Get event by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch event.",
    });
  }
};

export { createEvent, getEvents, getEventById };
