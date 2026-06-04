import http from "http";
import { Server } from "socket.io";

let io: Server | undefined;

export function initSocket(server: http.Server): Server {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join_room", (clerkId: string) => {
      socket.join(`user_${clerkId}`);
      console.log(`User ${clerkId} joined personal room`);
    });

    socket.on("join_map", () => {
      socket.join("civic-map");
      console.log(`Socket ${socket.id} joined civic-map room`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  console.log("Socket.io initialized");
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }

  return io;
}
