import dotenv from "dotenv";
import path from "path";

// Load .env first, then .env.local overrides (mirrors Next.js convention)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import morgan from "morgan";
import { connectDB } from "./config/db";
import { initSocket } from "./config/socket";
import { errorHandler } from "./middleware/errorHandler";
import { clerkAuth } from "./middleware/auth";
import complaintRoutes from "./routes/complaints";
import userRoutes from "./routes/users";
import wardRoutes from "./routes/wards";
import contractorRoutes from "./routes/contractors";
import aiRoutes from "./routes/ai";
import webhookRoutes from "./routes/webhooks";
import { initWorkers } from "./jobs/slaWorker";
import { initWeeklyEmailScheduler } from "./jobs/weeklyEmailScheduler";
import { startSLAChecker } from "./jobs/slaChecker";

// Import models to register schemas
import "./models/User";
import "./models/Complaint";
import "./models/Ward";
import "./models/Contractor";
import "./models/Notification";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));

// ⚠️ Webhook route is registered before express.json()
app.use("/api/webhooks", webhookRoutes);
app.use("/api/v1/webhooks", webhookRoutes);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply Clerk auth
app.use(clerkAuth);

// Routes (supporting both /api and /api/v1 paths)
app.use("/api/complaints", complaintRoutes);
app.use("/api/v1/complaints", complaintRoutes);

app.use("/api/users", userRoutes);
app.use("/api/v1/users", userRoutes);

app.use("/api/wards", wardRoutes);
app.use("/api/v1/wards", wardRoutes);

app.use("/api/contractors", contractorRoutes);
app.use("/api/v1/contractors", contractorRoutes);

app.use("/api/ai", aiRoutes);
app.use("/api/v1/ai", aiRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
const server = http.createServer(app);

async function bootstrap(): Promise<void> {
  await connectDB();
  initSocket(server);
  initWorkers();
  initWeeklyEmailScheduler();
  startSLAChecker();

  server.listen(PORT, () => {
    console.log(`NagarWatch server running on port ${PORT}`);
  });
}

void bootstrap();

export default app;
