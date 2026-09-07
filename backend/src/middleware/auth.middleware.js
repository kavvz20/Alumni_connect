import mongoose from "mongoose";
import { User } from "../models/index.js";

let firebaseAdmin = null;

const initFirebase = async () => {
  if (firebaseAdmin) return firebaseAdmin;

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY && !process.env.FIREBASE_PROJECT_ID) {
    return null;
  }

  try {
    const adminModule = await import("firebase-admin");
    const admin = adminModule.default || adminModule;

    if (admin.apps.length > 0) {
      firebaseAdmin = admin;
      return firebaseAdmin;
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseAdmin = admin;
      console.log("Firebase Admin SDK initialized with service account.");
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      firebaseAdmin = admin;
      console.log("Firebase Admin SDK initialized with project ID.");
    }
  } catch (error) {
    console.warn("Firebase Admin SDK not initialized; using dev/fallback auth:", error.message);
  }

  return firebaseAdmin;
};

const isValidId = (id) => mongoose.isValidObjectId(id);

/**
 * Authentication middleware:
 * 1. Checks Authorization: Bearer <firebaseIdToken>
 * 2. If Firebase Admin is available, verifies token and loads User by firebaseUid.
 * 3. Fallbacks for local dev/testing:
 *    - x-user-id header
 *    - x-firebase-uid header
 *    - actorId / userId from body / query
 */
const verifyAuth = async (req, res, next) => {
  try {
    let user = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const admin = await initFirebase();

      if (admin && admin.apps.length > 0) {
        try {
          const decoded = await admin.auth().verifyIdToken(token);
          user = await User.findOne({ firebaseUid: decoded.uid });
        } catch (tokenErr) {
          return res.status(401).json({
            success: false,
            message: "Invalid or expired Firebase ID token.",
          });
        }
      } else {
        // Dev fallback for Bearer token: token can be a direct firebaseUid or MongoDB ID
        if (isValidId(token)) {
          user = await User.findById(token);
        } else {
          user = await User.findOne({ firebaseUid: token });
        }
      }
    }

    // Header fallbacks for development/testing
    if (!user && req.headers["x-user-id"] && isValidId(req.headers["x-user-id"])) {
      user = await User.findById(req.headers["x-user-id"]);
    }

    if (!user && req.headers["x-firebase-uid"]) {
      user = await User.findOne({ firebaseUid: req.headers["x-firebase-uid"] });
    }

    // Fallback from request body / query (actorId, userId, postedBy, studentId)
    const fallbackId =
      req.body?.actorId ||
      req.body?.userId ||
      req.body?.postedBy ||
      req.body?.studentId ||
      req.query?.userId;

    if (!user && fallbackId && isValidId(fallbackId)) {
      user = await User.findById(fallbackId);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid Bearer token or identification header.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal authentication error.",
    });
  }
};

/**
 * Optional authentication middleware:
 * Attaches req.user if present, but does not block if unauthenticated.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const admin = await initFirebase();
      if (admin && admin.apps.length > 0) {
        try {
          const decoded = await admin.auth().verifyIdToken(token);
          req.user = await User.findOne({ firebaseUid: decoded.uid });
        } catch (_) {}
      } else if (isValidId(token)) {
        req.user = await User.findById(token);
      } else {
        req.user = await User.findOne({ firebaseUid: token });
      }
    }

    if (!req.user && req.headers["x-user-id"] && isValidId(req.headers["x-user-id"])) {
      req.user = await User.findById(req.headers["x-user-id"]);
    }

    const fallbackId = req.body?.actorId || req.body?.userId || req.query?.userId;
    if (!req.user && fallbackId && isValidId(fallbackId)) {
      req.user = await User.findById(fallbackId);
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${roles.join(", ")}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
};

export { verifyAuth, optionalAuth, requireRole };
