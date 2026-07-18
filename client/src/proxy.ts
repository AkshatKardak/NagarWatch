import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes — no auth required
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/map(.*)",
  "/complaints(.*)",
  "/unauthorized(.*)",
  "/api/v1/webhooks(.*)",
  "/api/webhooks(.*)",
]);

// Role-gated prefixes — must match the REAL App Router URLs (not route-group folders)
const isCitizenRoute = createRouteMatcher([
  "/citizen(.*)",       // /citizen/profile, /citizen/complaints, /citizen/submit
  "/dashboard(.*)",     // (citizen)/dashboard  → /dashboard
  "/submit(.*)",        // (citizen)/submit     → /submit
  "/notifications(.*)", // (citizen)/notifications → /notifications
  "/rti(.*)",           // (citizen)/rti        → /rti
]);
const isAuthorityRoute = createRouteMatcher([
  "/authority(.*)",           // /authority/... real segment pages
  "/authority-dashboard(.*)", // (authority)/authority-dashboard → /authority-dashboard
  "/analytics(.*)",           // (authority)/analytics → /analytics
]);
const isAdminRoute = createRouteMatcher([
  "/admin(.*)",           // /admin/... real segment pages
  "/admin-dashboard(.*)",// (admin)/admin-dashboard → /admin-dashboard
  "/users(.*)",           // (admin)/users → /users
  "/wards(.*)",           // (admin)/wards → /wards
]);

// Backward-compat redirects: old wrong URLs → real canonical App Router URLs
const LEGACY_REDIRECTS: Record<string, string> = {
  "/citizen/dashboard":   "/dashboard",            // was being used incorrectly
  "/authority/dashboard": "/authority-dashboard",  // was being used incorrectly
  "/admin/dashboard":     "/admin-dashboard",      // was being used incorrectly
};

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Unauthenticated → send to sign-in (except public routes)
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (!userId) return NextResponse.next();

  const role =
    (sessionClaims?.metadata as { role?: string } | undefined)?.role ?? "citizen";

  // Role guards
  if (isAdminRoute(req) && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (isAuthorityRoute(req) && role !== "authority" && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (isCitizenRoute(req) && role !== "citizen" && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Signed-in user hits root / → send to correct dashboard
  if (req.nextUrl.pathname === "/") {
    if (role === "admin")     return NextResponse.redirect(new URL("/admin-dashboard",     req.url));
    if (role === "authority") return NextResponse.redirect(new URL("/authority-dashboard", req.url));
    return NextResponse.redirect(new URL("/dashboard", req.url)); // citizen
  }

  // Legacy redirect aliases (old wrong paths → canonical URLs)
  const legacy = LEGACY_REDIRECTS[req.nextUrl.pathname];
  if (legacy) return NextResponse.redirect(new URL(legacy, req.url));

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
