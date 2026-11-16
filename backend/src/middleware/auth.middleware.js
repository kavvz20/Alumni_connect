import mongoose from "mongoose";
import { User } from "../models/index.js";
import { isAuthorizedAdmin, verifySessionToken } from "../services/auth.service.js";

/**
 * Resolves the logged-in user from `Authorization: Bearer <session token>`.
 * The session token is issued by /api/v1/auth/* after Google or password sign-in.
 *
 * Returns { user } on success, { error: {status, message} } on failure, or {} when no token was sent.
 * Identity is NEVER taken from headers like x-user-id or from request bodies.
 */
const resolveUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return {};

  const token = authHeader.slice(7).trim();
  let payload;
  try {
    payload = verifySessionToken(token);
  } catch (_) {
    return { error: { status: 401, message: "Your session has expired. Please sign in again." } };
  }

  if (!payload?.sub || !mongoose.isValidObjectId(payload.sub)) {
    return { error: { status: 401, message: "Invalid session token." } };
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    return { error: { status: 401, message: "This account no longer exists." } };
  }

  // A stored admin role is only honoured for the configured ADMIN_EMAIL.
  if (user.role === "admin" && !isAuthorizedAdmin(user)) {
    return { error: { status: 403, message: "This account is not authorized as an administrator." } };
  }

  return { user };
};

/** Requires a valid session. */
const verifyAuth = async (req, res, next) => {
  try {
    const { user, error } = await resolveUser(req);
    if (error) return res.status(error.status).json({ success: false, message: error.message });
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required. Please sign in." });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ success: false, message: "Internal authentication error." });
  }
};

/** Attaches req.user when a valid session is present, but never blocks. */
const optionalAuth = async (req, res, next) => {
  try {
    const { user } = await resolveUser(req);
    if (user) req.user = user;
  } catch (_) {
    // ignore: optional
  }
  next();
};

/** Role-based authorization. Must run after verifyAuth. */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    // "admin" is granted by ADMIN_EMAIL (on top of the account's own role); other roles come from the account.
    const allowed =
      (roles.includes("admin") && isAuthorizedAdmin(req.user)) ||
      (req.user.role !== "admin" && roles.includes(req.user.role));

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${roles.join(", ")}.`,
      });
    }
    next();
  };
};

export { verifyAuth, optionalAuth, requireRole };
