"use client";

import { Bell, Menu, X, Map, BarChart3, FileText, BookOpen, AlertCircle, HardHat, Scale } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/notificationStore";
import { useUserStore } from "@/store/userStore";
import { timeAgo } from "@/lib/utils";
import { NavbarUserMenu } from "@/components/layout/NavbarUserMenu";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function Navbar() {
  const { t } = useTranslation();
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
        : appUser?.role === "contractor"
          ? "/contractor/dashboard"
          : "/citizen/dashboard";

  const navLinks = [
    { href: "/", label: "Home", icon: null },
    { href: "/map", label: t("live_map"), icon: Map },
    { href: "/complaints", label: t("my_complaints"), icon: FileText },
    { href: "/contractors", label: t("contractors"), icon: HardHat },
    { href: "/analytics", label: t("analytics"), icon: BarChart3 },
    ...(isSignedIn
      ? [
          { href: "/citizen/rti", label: t("rti_generator"), icon: Scale },
          { href: dashboardHref, label: t("dashboard"), icon: null },
        ]
      : []),
  ];

  return (
    <nav
      className="fixed top-0 z-[1000] w-full transition-all duration-300"
      style={{
        borderBottom: scrolled ? "1px solid #ECE7DE" : "1px solid transparent",
        backgroundColor: scrolled ? "rgba(248,246,241,0.95)" : "rgba(248,246,241,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0 py-1 transition-transform hover:scale-[1.02]">
          <Image
            src="/Navbar.png"
            alt="NagarWatch"
            width={480}
            height={120}
            priority
            className="h-14 sm:h-16 md:h-16 w-auto object-contain drop-shadow-sm"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all hover:bg-black/5"
              style={{ color: "#4B5563" }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {isSignedIn ? (
            <>
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Notifications"
                  onClick={() => setNotificationsOpen((o) => !o)}
                  className="rounded-lg h-9 w-9"
                >
                  <Bell className="size-4" style={{ color: "#4B5563" }} />
                </Button>
                {unreadCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: "#D95D0F" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {notificationsOpen && (
                  <div
                    className="absolute right-0 mt-2 w-80 rounded-2xl border shadow-2xl overflow-hidden z-50"
                    style={{ backgroundColor: "#FFFFFF", borderColor: "#ECE7DE" }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3 border-b"
                      style={{ borderColor: "#ECE7DE" }}
                    >
                      <p className="text-sm font-bold" style={{ color: "#1F2937" }}>
                        {t("notifications")}
                      </p>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#FFF3EB", color: "#D95D0F" }}
                          >
                            {unreadCount} unread
                          </span>
                        )}
                        <Link
                          href="/notifications"
                          className="text-[11px] font-medium hover:underline"
                          style={{ color: "#D95D0F" }}
                          onClick={() => setNotificationsOpen(false)}
                        >
                          See all
                        </Link>
                      </div>
                    </div>
                    <div
                      className="max-h-72 overflow-y-auto divide-y"
                      style={{ borderColor: "#ECE7DE" }}
                    >
                      {notifications.slice(0, 5).length ? (
                        notifications.slice(0, 5).map((notification) => (
                          <div key={notification._id} className="px-4 py-3 hover:bg-gray-50">
                            <p className="text-xs line-clamp-2" style={{ color: "#1F2937" }}>
                              {notification.message}
                            </p>
                            <p className="mt-1 text-[10px]" style={{ color: "#9CA3AF" }}>
                              {timeAgo(notification.createdAt)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="px-4 py-6 text-center text-xs" style={{ color: "#9CA3AF" }}>
                          No notifications yet
                        </p>
                      )}
                    </div>
                    <div className="border-t px-4 py-2" style={{ borderColor: "#ECE7DE" }}>
                      <Link
                        href="/notifications"
                        className="block text-center text-xs font-bold py-1 hover:opacity-80"
                        style={{ color: "#D95D0F" }}
                        onClick={() => setNotificationsOpen(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <NavbarUserMenu />
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#4B5563" }}>
                  {t("sign_in")}
                </Button>
              </SignInButton>
              <Link href="/citizen/submit">
                <Button className="text-xs font-bold uppercase tracking-wider px-3.5 h-9 text-white shadow-sm" style={{ backgroundColor: "#D95D0F" }}>
                  <AlertCircle className="size-3.5 mr-1.5" />
                  {t("submit_complaint")}
                </Button>
              </Link>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            aria-label="Menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="border-t px-4 py-3 lg:hidden space-y-2 shadow-lg"
          style={{ backgroundColor: "#F8F6F1", borderColor: "#ECE7DE" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 py-2 text-sm font-semibold border-b last:border-0"
              style={{ color: "#1F2937", borderColor: "#ECE7DE" }}
              onClick={() => setMobileOpen(false)}
            >
              {link.icon && <link.icon className="size-4 text-muted-foreground" />}
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            {!isSignedIn && (
              <>
                <SignInButton mode="modal">
                  <Button variant="outline" className="w-full text-xs font-bold" style={{ borderColor: "#D95D0F", color: "#D95D0F" }}>
                    {t("sign_in")}
                  </Button>
                </SignInButton>
                <Link href="/citizen/submit" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full text-white text-xs font-bold" style={{ backgroundColor: "#D95D0F" }}>
                    {t("submit_complaint")}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
