import { Router } from "express";
import { getAlumni, matchAlumniMentor, scrapeLinkedInProfile, parseLinkedInPdf } from "../controllers/alumni.controller.js";
import { optionalAuth, requireCompleteProfile } from "../middleware/auth.middleware.js";

const alumniRouter = Router();

alumniRouter.get("/", getAlumni);
alumniRouter.post("/match", optionalAuth, requireCompleteProfile, matchAlumniMentor);
alumniRouter.post("/scrape-linkedin", optionalAuth, scrapeLinkedInProfile);
alumniRouter.post("/parse-linkedin-pdf", optionalAuth, parseLinkedInPdf);

export default alumniRouter;
