import { Server, Socket } from "socket.io";

export function setupSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    // Join ward room
    socket.on("join-ward", (wardId: string) => {
      socket.join(`ward:${wardId}`);
      console.log(`User ${socket.id} joined ward ${wardId}`);
    });

    // Join complaint room
    socket.on("join-complaint", (complaintId: string) => {
      socket.join(`complaint:${complaintId}`);
      console.log(`Socket ${socket.id} joined complaint ${complaintId}`);
    });

    // Join personal user room
    socket.on("join_room", (clerkId: string) => {
      socket.join(`user_${clerkId}`);
      console.log(`User ${clerkId} joined personal room`);
    });

    // Join civic map room
    socket.on("join_map", () => {
      socket.join("civic-map");
      console.log(`Socket ${socket.id} joined civic-map room`);
    });

    // Leave rooms on disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}

// Helper to emit events
export function emitToWard(io: Server, wardId: string, event: string, data: any): void {
  io.to(`ward:${wardId}`).emit(event, data);
}

export function emitToComplaint(io: Server, complaintId: string, event: string, data: any): void {
  io.to(`complaint:${complaintId}`).emit(event, data);
}

export function emitToUser(io: Server, clerkId: string, event: string, data: any): void {
  io.to(`user_${clerkId}`).emit(event, data);
}

export function emitToCivicMap(io: Server, event: string, data: any): void {
  io.to("civic-map").emit(event, data);
}
