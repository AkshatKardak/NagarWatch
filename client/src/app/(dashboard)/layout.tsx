"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import type { UserRole } from "@/lib/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-[#D95D0F]" />
          <p className="text-xs font-semibold text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const role = ((user?.publicMetadata?.role as string) || "citizen") as UserRole;

  return <DashboardShell role={role}>{children}</DashboardShell>;
}
