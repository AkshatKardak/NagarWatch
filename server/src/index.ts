import dotenv from "dotenv";
import path from "path";

// Load .env first, then .env.local overrides (mirrors Next.js convention)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import cors from "cors";
import express from "express";
import helmet from "helmet";
import http from "http";
import morgan from "morgan";
import { connectDB } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";
import { clerkAuth } from "./middleware/auth";
import complaintRoutes from "./routes/complaints";
import userRoutes from "./routes/users";
import wardRoutes from "./routes/wards";
import aiRoutes from "./routes/ai";
import webhookRoutes from "./routes/webhooks";
import { initWorkers } from "./jobs/slaWorker";
import { initWeeklyEmailScheduler } from "./jobs/weeklyEmailScheduler";
import { initSocket } from "./socket";

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const port = process.env.PORT || "5000";

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));

// ⚠️  Webhook route MUST be registered before express.json() so that
// the raw body stream is available for Svix signature verification.
// express.json() consumes the stream and makes rawBody unavailable.
app.use("/api/v1/webhooks", webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply Clerk auth globally so getAuth(req) works in every route
app.use(clerkAuth);

app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/wards", wardRoutes);
app.use("/api/v1/ai", aiRoutes);

app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

async function bootstrap(): Promise<void> {
  await connectDB();
  initWorkers();
  initWeeklyEmailScheduler();

  server.listen(port, () => {
    console.log(`NagarWatch server running on port ${port}`);
  });
}

void bootstrap();
