import http from "http";
import { Server } from "socket.io";
import { setupSocketHandlers } from "../socket/handlers";

let io: Server | undefined;

export function initSocket(server: http.Server): Server {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000",
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
