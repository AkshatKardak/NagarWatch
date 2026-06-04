"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useUserStore } from "@/store/userStore";

export default function AuthorityLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const fetchMe = useUserStore((state) => state.fetchMe);

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (user && user.role !== "authority") router.replace("/unauthorized");
  }, [router, user]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar role="authority" />
        <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
