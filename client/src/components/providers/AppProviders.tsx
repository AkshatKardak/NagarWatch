"use client";

import type { ReactNode } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useSocket } from "@/hooks/useSocket";

export function AppProviders({ children }: { children: ReactNode }) {
  useAuthToken();
  useSocket();
  return <>{children}</>;
}
