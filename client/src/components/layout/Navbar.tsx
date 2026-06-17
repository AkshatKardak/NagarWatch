"use client";

import { Bell, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
      ? "/admin/admin-dashboard"
      : appUser?.role === "authority"
        ? "/authority/authority-dashboard"
        : "/dashboard";

  const navLinks = [
    { href: "/map", label: "Map" },
    { href: "/complaints", label: "Complaints" },
    ...(isSignedIn ? [{ href: dashboardHref, label: "Dashboard" }] : []),
  ];

  return (
    <nav
      className="fixed top-0 z-50 w-full border-b bg-white/95 shadow-sm backdrop-blur"
      style={{ borderColor: "#ECE7DE" }}
    >
      {/* Navbar height bumped to h-20 (80px) to give the bigger logo breathing room */}
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center">
          <Image
            src="/Navbar.png"
            alt="NagarWatch"
            width={220}      /* render hint — actual size controlled by className */
            height={56}
            priority         /* LCP asset — preload immediately */
            className="h-14 w-auto object-contain" /* h-14 = 56px tall, width scales automatically */
          />
        </Link>

        {/* ── Desktop nav links ── */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "#4B5563" }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ── Auth + mobile toggle ── */}
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <>
              {/* Notification bell */}
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Notifications"
                  onClick={() => setNotificationsOpen((open) => !open)}
                >
                  <Bell className="size-4" style={{ color: "#4B5563" }} />
                </Button>
                {unreadCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ backgroundColor: "#D95D0F" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}

                {/* Notification dropdown */}
                {notificationsOpen && (
                  <div
                    className="absolute right-0 mt-2 w-80 rounded-xl border shadow-xl overflow-hidden"
                    style={{ backgroundColor: "#FFFFFF", borderColor: "#ECE7DE" }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3 border-b"
                      style={{ borderColor: "#ECE7DE" }}
                    >
                      <p className="text-sm font-bold" style={{ color: "#1F2937" }}>Notifications</p>
                      {unreadCount > 0 && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#FFF3EB", color: "#D95D0F" }}
                        >
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: "#ECE7DE" }}>
                      {notifications.slice(0, 5).length ? (
                        notifications.slice(0, 5).map((notification) => (
                          <div key={notification._id} className="px-4 py-3 hover:bg-gray-50">
                            <p className="text-xs line-clamp-2" style={{ color: "#1F2937" }}>{notification.message}</p>
                            <p className="mt-1 text-[10px]" style={{ color: "#9CA3AF" }}>{timeAgo(notification.createdAt)}</p>
                          </div>
                        ))
                      ) : (
                        <p className="px-4 py-6 text-center text-xs" style={{ color: "#9CA3AF" }}>No notifications yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <SignInButton mode="modal">
              <Button
                variant="outline"
                className="text-xs font-bold"
                style={{ borderColor: "#D95D0F", color: "#D95D0F" }}
              >
                Sign In
              </Button>
            </SignInButton>
          )}

          {/* Mobile hamburger */}
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

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div
          className="border-t px-4 py-3 md:hidden"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#ECE7DE" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2.5 text-sm font-medium border-b last:border-0"
              style={{ color: "#1F2937", borderColor: "#ECE7DE" }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
