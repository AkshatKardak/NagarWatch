"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useCallback } from "react";
import { setAuthToken, setTokenFetcher, clearTokenFetcher } from "@/lib/api";

/**
 * Registers a live Clerk `getToken` callback into the axios interceptor so
 * every single request — including complaint submissions — always carries a
 * fresh, non-expired JWT regardless of when the request is made.
 *
 * Also keeps `authToken` updated on sign-in/sign-out and proactively
 * refreshes it every 55 minutes (Clerk tokens expire after 60 min).
 */
export function useAuthToken(): void {
  const { getToken, isSignedIn } = useAuth();

  // Stable reference to getToken so the interceptor always calls the latest
  const fetchToken = useCallback(async (): Promise<string | null> => {
    if (!isSignedIn) return null;
    return getToken();
  }, [getToken, isSignedIn]);

  // Register / unregister the live fetcher in the axios interceptor
  useEffect(() => {
    if (isSignedIn) {
      setTokenFetcher(fetchToken);
    } else {
      clearTokenFetcher();
    }
    return () => {
      // Do NOT call clearTokenFetcher on every cleanup — only on sign-out.
      // Cleanup on unmount would break requests fired after navigation.
    };
  }, [isSignedIn, fetchToken]);

  // Also eagerly populate the cache on sign-in / sign-out
  useEffect(() => {
    let active = true;
    async function syncCache(): Promise<void> {
      if (isSignedIn) {
        const token = await getToken();
        if (active) setAuthToken(token);
      } else {
        setAuthToken(null);
      }
    }
    void syncCache();
    return () => { active = false; };
  }, [getToken, isSignedIn]);

  // Proactive 55-min refresh so long sessions never silently expire
  useEffect(() => {
    if (!isSignedIn) return;
    const id = setInterval(async () => {
      const token = await getToken();
      setAuthToken(token);
    }, 55 * 60 * 1000);
    return () => clearInterval(id);
  }, [isSignedIn, getToken]);
}
