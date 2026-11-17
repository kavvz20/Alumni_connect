import { Router } from "express";
import { googleSignIn, passwordLogin, getCurrentUser } from "../controllers/auth.controller.js";
import { verifyAuth } from "../middleware/auth.middleware.js";

const authRouter = Router();

authRouter.post("/google", googleSignIn);
authRouter.post("/login", passwordLogin);
// New accounts are created only through Google sign-in (proves the email belongs to the user).
authRouter.get("/me", verifyAuth, getCurrentUser);

export default authRouter;
