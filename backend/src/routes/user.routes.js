import { Router } from "express";
import {
  createUser,
  loginUser,
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  verifyAlumni,
  onboardUser,
  bulkOnboardUsers,
  deleteUser,
} from "../controllers/user.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const userRouter = Router();

userRouter.route("/").post(createUser).get(getAllUsers);
userRouter.post("/login", loginUser);
userRouter.post("/onboard", optionalAuth, onboardUser);
userRouter.post("/bulk-onboard", optionalAuth, bulkOnboardUsers);
userRouter.get("/:userId", getUserProfile);
userRouter.patch("/:userId", optionalAuth, updateUserProfile);
userRouter.delete("/:userId", optionalAuth, deleteUser);
userRouter.patch("/:userId/verify", optionalAuth, verifyAlumni);

export default userRouter;
