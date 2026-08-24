"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import CitizenDashboardPage from "../citizen/dashboard/page";
import AuthorityDashboardPage from "../authority/dashboard/page";
import AdminDashboardPage from "../admin/dashboard/page";
import ContractorDashboardPage from "../contractor/dashboard/page";

export default function UnifiedDashboardRouter() {
  const router = useRouter();
  const { role, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }

    // Client-side push to canonical role URL if desired
    if (role === "admin") router.replace("/admin/dashboard");
    else if (role === "authority") router.replace("/authority/dashboard");
    else if (role === "contractor") router.replace("/contractor/dashboard");
    else router.replace("/citizen/dashboard");
  }, [isLoaded, isSignedIn, role, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#D95D0F]" />
          <p className="text-xs font-semibold text-slate-500">Loading your civic dashboard...</p>
        </div>
      </div>
    );
  }

  // Render role dashboard inline as immediate fallback
  if (role === "admin") return <AdminDashboardPage />;
  if (role === "authority") return <AuthorityDashboardPage />;
  if (role === "contractor") return <ContractorDashboardPage />;
  return <CitizenDashboardPage />;
}
