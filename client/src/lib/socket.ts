import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socket.on("connect", () => console.log("Socket connected:", socket?.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
    socket.on("connect_error", (err: Error) => console.error("Socket error:", err.message));
  }
  return socket;
}

export function joinMapRoom(): void {
  getSocket().emit("join_map");
}

export function joinUserRoom(clerkId: string): void {
  getSocket().emit("join_room", clerkId);
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default getSocket;
