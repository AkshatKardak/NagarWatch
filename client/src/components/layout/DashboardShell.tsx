"use client";

import * as React from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/lib/types";

interface DashboardShellProps {
  children: React.ReactNode;
  role?: UserRole;
}

export function DashboardShell({ children, role: propRole }: DashboardShellProps) {
  const { role: authRole } = useAuth();
  const activeRole = propRole || authRole || "citizen";

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900">
      <Navbar />
      <div className="flex pt-20">
        <Sidebar role={activeRole as any} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full min-h-[calc(100vh-5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardShell;
