import { Router } from "express";
import { googleSignIn, passwordLogin, passwordRegister, getCurrentUser } from "../controllers/auth.controller.js";
import { verifyAuth } from "../middleware/auth.middleware.js";

const authRouter = Router();

authRouter.post("/google", googleSignIn);
authRouter.post("/login", passwordLogin);
authRouter.post("/register", passwordRegister);
authRouter.get("/me", verifyAuth, getCurrentUser);

export default authRouter;
