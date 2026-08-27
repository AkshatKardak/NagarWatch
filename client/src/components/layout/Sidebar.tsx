"use client";

import {
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Map,
  Plus,
  Scale,
  Users,
  HardHat,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const linksByRole: Record<UserRole, SidebarLink[]> = {
  citizen: [
    { href: "/citizen/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/citizen/submit", label: "Submit Issue", icon: Plus },
    { href: "/citizen/complaints", label: "My Grievances", icon: FileText },
    { href: "/citizen/notifications", label: "Notifications", icon: Bell },
    { href: "/citizen/rti", label: "RTI Generator", icon: Scale },
    { href: "/map", label: "Live Ward Map", icon: Map },
    { href: "/profile", label: "My Profile", icon: User },
  ],
  authority: [
    { href: "/authority/dashboard", label: "Control Center", icon: LayoutDashboard },
    { href: "/authority/complaints", label: "Triage Queue", icon: ClipboardList },
    { href: "/authority/analytics", label: "Performance", icon: BarChart3 },
    { href: "/authority/wards", label: "Jurisdiction", icon: Map },
    { href: "/citizen/rti", label: "RTI Generator", icon: Scale },
    { href: "/profile", label: "My Profile", icon: User },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Executive Hub", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Roles", icon: Users },
    { href: "/admin/wards", label: "Ward Zones", icon: Map },
    { href: "/admin/contractors", label: "Contractors Audit", icon: HardHat },
    { href: "/admin/analytics", label: "City Analytics", icon: BarChart3 },
    { href: "/citizen/rti", label: "RTI Generator", icon: Scale },
    { href: "/profile", label: "My Profile", icon: User },
  ],
  contractor: [
    { href: "/contractor/dashboard", label: "Field Portal", icon: LayoutDashboard },
    { href: "/contractor/tasks", label: "Work Orders", icon: ClipboardList },
    { href: "/citizen/rti", label: "RTI Generator", icon: Scale },
    { href: "/profile", label: "My Profile", icon: User },
  ],
};

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const currentRole = role && linksByRole[role] ? role : "citizen";
  const links = linksByRole[currentRole] || linksByRole.citizen;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-stone-200 bg-white lg:block shadow-xs">
      <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto space-y-1 p-4">
        <div className="px-3 py-2 mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#D95D0F]">
            {currentRole} Workspace
          </p>
        </div>

        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all",
                active
                  ? "bg-orange-50 text-[#D95D0F] border border-orange-200/80 shadow-xs"
                  : "text-slate-600 hover:bg-stone-50 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-transform",
                  active ? "text-[#D95D0F]" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

export default Sidebar;
