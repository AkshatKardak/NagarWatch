import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useUserStore } from "@/store/userStore";
import type { UserRole } from "@/lib/types";

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken, signOut } = useClerkAuth();
  const appUser = useUserStore((state) => state.user);
  const fetchMe = useUserStore((state) => state.fetchMe);

  const role = ((user?.publicMetadata?.role as string) || appUser?.role || "citizen") as UserRole;

  return {
    user,
    appUser,
    role,
    isLoaded,
    isSignedIn,
    getToken,
    signOut,
    fetchMe,
    isCitizen: role === "citizen",
    isAuthority: role === "authority",
    isAdmin: role === "admin",
    isContractor: role === "contractor",
  };
}

export default useAuth;
