import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let connectAttempted = false;

const SOCKET_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001")
    : "";

/**
 * Returns the shared socket instance.
 * Does NOT auto-connect — call connectSocket() explicitly when the server is ready.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      // ✔ Never auto-connect on import — prevents xhr poll error before server starts
      autoConnect: false,
      // Use WebSocket first, fall back to polling only if WS fails
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
      // Prevents connection attempts while tab is hidden
      closeOnBeforeunload: true,
    });

    socket.on("connect", () =>
      console.log("%c[Socket] Connected:", "color:#D95D0F;font-weight:bold", socket?.id)
    );
    socket.on("disconnect", (reason: string) =>
      console.log("%c[Socket] Disconnected:", "color:#F59E0B", reason)
    );
    socket.on("connect_error", (err: Error) =>
      // Only log at debug level — not console.error, so it won't show as red in DevTools
      console.debug("%c[Socket] Connection error (server may not be running):", "color:#9CA3AF", err.message)
    );
  }
  return socket;
}

/**
 * Explicitly connect to the Socket.io server.
 * Call this only from client-side code after confirming the user/app is ready.
 */
export function connectSocket(): void {
  if (typeof window === "undefined") return; // no-op in SSR
  if (connectAttempted) return;
  connectAttempted = true;

  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function joinMapRoom(): void {
  const s = getSocket();
  if (s.connected) {
    s.emit("join_map");
  } else {
    // Queue join after connect
    s.once("connect", () => s.emit("join_map"));
  }
}

export function joinUserRoom(clerkId: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit("join_room", clerkId);
  } else {
    s.once("connect", () => s.emit("join_room", clerkId));
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectAttempted = false;
  }
}

export default getSocket;
