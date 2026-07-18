"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { LogOut, User, Crown, Shield, Users, ChevronDown } from "lucide-react";

const ROLE_META = {
  citizen:   { label: "Citizen",   color: "#2563eb", Icon: Users  },
  authority: { label: "Authority", color: "#10b981", Icon: Shield },
  admin:     { label: "Admin",     color: "#f59e0b", Icon: Crown  },
} as const;

type Role = keyof typeof ROLE_META;

export function NavbarUserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const appUser = useUserStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const role = ((user?.publicMetadata?.role as string) ?? appUser?.role ?? "citizen") as Role;
  const meta = ROLE_META[role] ?? ROLE_META.citizen;
  const { Icon } = meta;

  const profileHref =
    role === "admin" ? "/admin/profile" :
    role === "authority" ? "/authority/profile" :
    "/citizen/profile";

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const initials = (user.fullName ?? user.firstName ?? "U").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-2 shadow-sm hover:shadow-md transition-shadow"
        aria-label="Account menu"
      >
        {user.imageUrl ? (
          <img src={user.imageUrl} alt={user.fullName ?? ""} className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: meta.color }}>{initials}</span>
        )}
        <ChevronDown className="size-3 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden z-50">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900 truncate">{user.fullName ?? user.firstName}</p>
            <p className="text-xs text-gray-400 truncate">{user.primaryEmailAddress?.emailAddress}</p>
          </div>

          {/* Role badge */}
          <div className="px-4 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: `${meta.color}15` }}>
              <Icon size={14} style={{ color: meta.color }} />
              <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.label}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); router.push(profileHref); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User size={14} className="text-gray-400" />
              View Profile
            </button>

            <button
              onClick={async () => { setOpen(false); await signOut(); router.push("/"); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
