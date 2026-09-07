import express from "express";
import cors from "cors";
import alumniRouter from "./routes/alumni.routes.js";
import chatRouter from "./routes/chat.routes.js";
import eventRouter from "./routes/event.routes.js";
import forumRouter from "./routes/forum.routes.js";
import mentorshipRequestRouter from "./routes/mentorship-request.routes.js";
import opportunityRouter from "./routes/opportunity.routes.js";
import referralRequestRouter from "./routes/referral-request.routes.js";
import reportRouter from "./routes/report.routes.js";
import successStoryRouter from "./routes/success-story.routes.js";
import userRouter from "./routes/user.routes.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/alumni", alumniRouter);
app.use("/api/v1/mentorship-requests", mentorshipRequestRouter);
app.use("/api/v1/referral-requests", referralRequestRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/opportunities", opportunityRouter);
app.use("/api/v1/forum", forumRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/success-stories", successStoryRouter);
app.use("/api/v1/reports", reportRouter);

// Health check endpoints
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Alumni Connect API is online", timestamp: new Date().toISOString() });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Fallback JSON 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: `Endpoint not found: Cannot ${req.method} ${req.originalUrl}`,
    success: false,
  });
});

export { app };
