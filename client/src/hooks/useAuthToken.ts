"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { setAuthToken } from "@/lib/api";

export function useAuthToken(): void {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    let active = true;

    async function syncToken(): Promise<void> {
      if (isSignedIn) {
        const token = await getToken();
        if (active) setAuthToken(token);
      } else {
        setAuthToken(null);
      }
    }

    void syncToken();
    return () => {
      active = false;
    };
  }, [getToken, isSignedIn]);
}
