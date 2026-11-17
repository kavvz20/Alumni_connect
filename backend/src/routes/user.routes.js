import { Router } from "express";
import {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  verifyAlumni,
  onboardUser,
  bulkOnboardUsers,
  deleteUser,
} from "../controllers/user.controller.js";
import { passwordLogin, passwordRegister } from "../controllers/auth.controller.js";
import { verifyAuth, optionalAuth, requireRole } from "../middleware/auth.middleware.js";

const userRouter = Router();

// Legacy paths kept for compatibility; they use the same handlers as /api/v1/auth/*
userRouter.post("/", passwordRegister);
userRouter.post("/login", passwordLogin);

userRouter.get("/", verifyAuth, getAllUsers);
userRouter.post("/onboard", verifyAuth, requireRole("admin"), onboardUser);
userRouter.post("/bulk-onboard", verifyAuth, requireRole("admin"), bulkOnboardUsers);
userRouter.get("/:userId", optionalAuth, getUserProfile);
userRouter.patch("/:userId", verifyAuth, updateUserProfile);
userRouter.delete("/:userId", verifyAuth, requireRole("admin"), deleteUser);
userRouter.patch("/:userId/verify", verifyAuth, requireRole("admin"), verifyAlumni);

export default userRouter;
