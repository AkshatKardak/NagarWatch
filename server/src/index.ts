import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import helmet from "helmet";
import http from "http";
import morgan from "morgan";
import { connectDB } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";
import complaintRoutes from "./routes/complaints";
import userRoutes from "./routes/users";
import wardRoutes from "./routes/wards";
import aiRoutes from "./routes/ai";
import { initWorkers } from "./jobs/slaWorker";
import { initSocket } from "./socket";

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

  server.listen(port, () => {
    console.log(`NagarWatch server running on port ${port}`);
  });
}

void bootstrap();
