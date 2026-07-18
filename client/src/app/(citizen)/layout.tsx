"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useUserStore } from "@/store/userStore";

export default function CitizenLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const fetchMe = useUserStore((state) => state.fetchMe);

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    // Redirect wrong-role users to their correct dashboard
    if (user?.role === "authority") router.replace("/authority/dashboard");
    if (user?.role === "admin")     router.replace("/admin/dashboard");
  }, [router, user?.role]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar role="citizen" />
        <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
