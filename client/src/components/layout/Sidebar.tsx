"use client";

import { BarChart3, Bell, ClipboardList, FileText, LayoutDashboard, Map, Plus, Scale, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/user";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const linksByRole: Record<UserRole, SidebarLink[]> = {
  citizen: [
    { href: "/citizen/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/citizen/submit",    label: "Submit Issue", icon: Plus },
    { href: "/citizen/complaints", label: "My Complaints", icon: FileText },
    { href: "/notifications",     label: "Notifications", icon: Bell },
    { href: "/map",              label: "City Map", icon: Map },
    { href: "/rti",              label: "RTI Letter", icon: Scale },
  ],
  authority: [
    { href: "/authority/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
    { href: "/authority/complaints", label: "All Complaints", icon: ClipboardList },
    { href: "/authority/analytics",  label: "Analytics",   icon: BarChart3 },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/wards",     label: "Wards",     icon: Map },
    { href: "/admin/users",     label: "Users",     icon: Users },
    { href: "/admin/dashboard", label: "Analytics", icon: BarChart3 },
  ],
};

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  return (
    // top-16 = 64px, must match navbar h-16 and layout pt-16
    <aside className="hidden w-64 shrink-0 border-r bg-white lg:block">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto space-y-1 p-4">
        {linksByRole[role].map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-muted",
                active && "bg-primary/10 font-medium text-primary"
              )}
            >
              <Icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
