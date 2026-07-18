"use client";

import { Bell, Menu, X, Map, BarChart3, FileText, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/notificationStore";
import { useUserStore } from "@/store/userStore";
import { timeAgo } from "@/lib/utils";
import { NavbarUserMenu } from "@/components/layout/NavbarUserMenu";

export function Navbar() {
  const { isSignedIn } = useUser();
  const appUser = useUserStore((state) => state.user);
  const fetchMe = useUserStore((state) => state.fetchMe);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      void fetchMe();
      void fetchNotifications();
    }
  }, [fetchMe, fetchNotifications, isSignedIn]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const dashboardHref =
    appUser?.role === "admin"
      ? "/admin/dashboard"
      : appUser?.role === "authority"
        ? "/authority/dashboard"
        : "/citizen/dashboard";

  const navLinks = [
    { href: "/", label: "Home", icon: null },
    { href: "/map", label: "Live Map", icon: Map },
    { href: "/complaints", label: "Complaints", icon: FileText },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/docs", label: "Documentation", icon: BookOpen },
    ...(isSignedIn ? [{ href: dashboardHref, label: "Dashboard", icon: null }] : []),
  ];

  return (
    <nav
      className="fixed top-0 z-50 w-full transition-all duration-300"
      style={{
        borderBottom: scrolled ? "1px solid #ECE7DE" : "1px solid transparent",
        backgroundColor: scrolled ? "rgba(248,246,241,0.92)" : "rgba(248,246,241,0.80)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">

        {/* Logo — larger image */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/Navbar.png"
            alt="NagarWatch"
            width={360}
            height={90}
            priority
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-black/5"
              style={{ color: "#4B5563" }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <>
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Notifications"
                  onClick={() => setNotificationsOpen((o) => !o)}
                >
                  <Bell className="size-5" style={{ color: "#4B5563" }} />
                </Button>
                {unreadCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ backgroundColor: "#D95D0F" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {notificationsOpen && (
                  <div
                    className="absolute right-0 mt-2 w-80 rounded-2xl border shadow-2xl overflow-hidden"
                    style={{ backgroundColor: "#FFFFFF", borderColor: "#ECE7DE" }}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#ECE7DE" }}>
                      <p className="text-sm font-bold" style={{ color: "#1F2937" }}>Notifications</p>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFF3EB", color: "#D95D0F" }}>
                            {unreadCount} unread
                          </span>
                        )}
                        <Link href="/notifications" className="text-[11px] font-medium hover:underline" style={{ color: "#D95D0F" }} onClick={() => setNotificationsOpen(false)}>See all</Link>
                      </div>
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
                    <div className="border-t px-4 py-2" style={{ borderColor: "#ECE7DE" }}>
                      <Link href="/notifications" className="block text-center text-xs font-bold py-1 hover:opacity-80" style={{ color: "#D95D0F" }} onClick={() => setNotificationsOpen(false)}>View all notifications</Link>
                    </div>
                  </div>
                )}
              </div>
              <NavbarUserMenu />
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" className="text-sm font-medium" style={{ color: "#4B5563" }}>Sign In</Button>
              </SignInButton>
              <Link href="/citizen/submit">
                <Button className="text-sm font-bold px-4 text-white" style={{ backgroundColor: "#D95D0F" }}>
                  <AlertCircle className="size-4 mr-1.5" />
                  Report Issue
                </Button>
              </Link>
            </div>
          )}

          <Button type="button" variant="ghost" size="icon" className="md:hidden" aria-label="Menu" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t px-4 py-3 md:hidden" style={{ backgroundColor: "#F8F6F1", borderColor: "#ECE7DE" }}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block py-2.5 text-sm font-medium border-b last:border-0" style={{ color: "#1F2937", borderColor: "#ECE7DE" }} onClick={() => setMobileOpen(false)}>{link.label}</Link>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            {!isSignedIn && (
              <>
                <SignInButton mode="modal"><Button variant="outline" className="w-full" style={{ borderColor: "#D95D0F", color: "#D95D0F" }}>Sign In</Button></SignInButton>
                <Link href="/citizen/submit"><Button className="w-full text-white font-bold" style={{ backgroundColor: "#D95D0F" }}>Report Issue</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
