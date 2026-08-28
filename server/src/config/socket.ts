import http from "http";
import { Server } from "socket.io";
import { setupSocketHandlers } from "../socket/handlers";

let io: Server | undefined;

const ALLOWED_SOCKET_ORIGINS = [
  "https://nagarwatch.netlify.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  process.env.CLIENT_URL?.replace(/\/$/, ""),
  process.env.FRONTEND_URL?.replace(/\/$/, ""),
].filter(Boolean) as string[];

export function initSocket(server: http.Server): Server {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/$/, "");
        if (
          ALLOWED_SOCKET_ORIGINS.includes(normalized) ||
          normalized.endsWith(".netlify.app") ||
          normalized.endsWith(".vercel.app") ||
          normalized.endsWith(".onrender.com")
        ) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by Socket.io CORS`));
        }
      },
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true,
    },
  });

  setupSocketHandlers(io);

  console.log("✅ Socket.io initialized");
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
}

export default { initSocket, getIO };
