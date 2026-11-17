import { Router } from "express";
import { getLinkedinStatus, linkedinCallback, startLinkedinConnect } from "../controllers/linkedin.controller.js";
import { verifyAuth } from "../middleware/auth.middleware.js";

const linkedinRouter = Router();

linkedinRouter.get("/status", getLinkedinStatus);
linkedinRouter.get("/connect", verifyAuth, startLinkedinConnect);
// LinkedIn redirects the browser here; the signed `state` identifies the user.
linkedinRouter.get("/callback", linkedinCallback);

export default linkedinRouter;
