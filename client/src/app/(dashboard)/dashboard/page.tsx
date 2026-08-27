"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { OAuthRoleModal } from "@/components/auth/OAuthRoleModal";
import CitizenDashboardPage from "../citizen/dashboard/page";
import AuthorityDashboardPage from "../authority/dashboard/page";
import AdminDashboardPage from "../admin/dashboard/page";
import ContractorDashboardPage from "../contractor/dashboard/page";

export default function UnifiedDashboardRouter() {
  const router = useRouter();
  const { user, role, isLoaded, isSignedIn } = useAuth();
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }

    const hasConfirmedInStorage =
      typeof window !== "undefined" &&
      localStorage.getItem("nagarwatch_role_confirmed") === "true";

    const hasConfirmedInMetadata = Boolean(
      (user?.unsafeMetadata as any)?.roleConfirmed || (user?.publicMetadata as any)?.role
    );

    // If role has not been confirmed, prompt the role modal
    if (!hasConfirmedInStorage && !hasConfirmedInMetadata) {
      setNeedsRoleSelection(true);
      return;
    }

    // Role is confirmed: push to canonical role dashboard
    if (role === "admin") router.replace("/admin/dashboard");
    else if (role === "authority") router.replace("/authority/dashboard");
    else if (role === "contractor") router.replace("/contractor/dashboard");
    else router.replace("/citizen/dashboard");
  }, [isLoaded, isSignedIn, role, user, router]);

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

  if (needsRoleSelection) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <OAuthRoleModal
          forceOpen={true}
          onClose={() => setNeedsRoleSelection(false)}
        />
      </div>
    );
  }

  // Render role dashboard inline as immediate fallback
  if (role === "admin") return <AdminDashboardPage />;
  if (role === "authority") return <AuthorityDashboardPage />;
  if (role === "contractor") return <ContractorDashboardPage />;
  return <CitizenDashboardPage />;
}
