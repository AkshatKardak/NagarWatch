"use client"

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { connectSocket, joinUserRoom, disconnectSocket } from "@/lib/socket";

/**
 * Initializes the Socket.io connection lazily.
 * • Only connects after the Clerk user context is ready
 * • Joins the user's personal notification room if signed in
 * • Never throws or logs errors as console.error
 */
export function useSocket(): void {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Wait until Clerk has finished loading before connecting
    if (!isLoaded) return;

    // Connect to Socket.io server
    connectSocket();

    // Join personal room for real-time notifications if user is signed in
    if (user?.id) {
      joinUserRoom(user.id);
    }

    // Cleanup: do NOT disconnect on unmount because this hook runs in the root
    // layout — disconnecting would drop the connection on every re-render.
    // Socket is cleaned up on full page unload via closeOnBeforeunload:true.
  }, [isLoaded, user?.id]);
}
