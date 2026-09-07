import { Router } from "express";
import { getAlumni, matchAlumniMentor } from "../controllers/alumni.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const alumniRouter = Router();

alumniRouter.get("/", getAlumni);
alumniRouter.post("/match", optionalAuth, matchAlumniMentor);

export default alumniRouter;
