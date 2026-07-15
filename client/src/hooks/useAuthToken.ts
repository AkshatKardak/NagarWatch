"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useCallback } from "react";
import { setAuthToken } from "@/lib/api";

/**
 * Keeps the axios `authToken` module variable in sync with the current
 * Clerk session. Also refreshes the token every 55 minutes so it never
 * silently expires mid-session (Clerk JWTs default to 60 min).
 */
export function useAuthToken(): void {
  const { getToken, isSignedIn } = useAuth();

  const refresh = useCallback(async (): Promise<void> => {
    if (isSignedIn) {
      const token = await getToken();
      setAuthToken(token);
    } else {
      setAuthToken(null);
    }
  }, [getToken, isSignedIn]);

  // Sync on sign-in / sign-out
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Proactive refresh every 55 minutes
  useEffect(() => {
    if (!isSignedIn) return;
    const id = setInterval(() => { void refresh(); }, 55 * 60 * 1000);
    return () => clearInterval(id);
  }, [isSignedIn, refresh]);
}
