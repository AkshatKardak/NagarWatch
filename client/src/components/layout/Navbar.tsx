"use client";

import { Bell, Menu, MapPin, X } from "lucide-react";
import Link from "next/link";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/notificationStore";
import { useUserStore } from "@/store/userStore";
import { timeAgo } from "@/lib/utils";

export function Navbar() {
  const { isSignedIn } = useUser();
  const appUser = useUserStore((state) => state.user);
  const fetchMe = useUserStore((state) => state.fetchMe);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      void fetchMe();
      void fetchNotifications();
    }
  }, [fetchMe, fetchNotifications, isSignedIn]);

  const dashboardHref =
    appUser?.role === "admin"
      ? "/admin/dashboard"
      : appUser?.role === "authority"
        ? "/authority/dashboard"
        : "/citizen/dashboard";

  const navLinks = [
    { href: "/map", label: "Map" },
    { href: "/complaints", label: "Complaints" },
    ...(isSignedIn ? [{ href: dashboardHref, label: "Dashboard" }] : []),
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <MapPin className="size-5 text-emerald-700" />
          <span>NagarWatch</span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <>
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Notifications"
                  onClick={() => setNotificationsOpen((open) => !open)}
                >
                  <Bell className="size-4" />
                </Button>
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                ) : null}
                {notificationsOpen ? (
                  <div className="absolute right-0 mt-2 w-80 border bg-white p-3 shadow-lg">
                    <p className="mb-2 text-sm font-semibold">Notifications</p>
                    <div className="space-y-2">
                      {notifications.slice(0, 5).length ? (
                        notifications.slice(0, 5).map((notification) => (
                          <div key={notification._id} className="border p-2 text-sm">
                            <p className="line-clamp-2">{notification.message}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No notifications yet</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <SignInButton mode="modal">
              <Button variant="outline">Sign In</Button>
            </SignInButton>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>
      {mobileOpen ? (
        <div className="border-t bg-white px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </nav>
  );
}
