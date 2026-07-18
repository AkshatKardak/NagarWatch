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

// Role-gated prefixes
const isCitizenRoute   = createRouteMatcher(["/citizen(.*)", "/dashboard(.*)", "/notifications(.*)", "/rti(.*)"]);
const isAuthorityRoute = createRouteMatcher(["/authority(.*)", "/analytics(.*)"]);
const isAdminRoute     = createRouteMatcher(["/admin(.*)"]);

// Legacy URL aliases → real file-system routes
const LEGACY_REDIRECTS: Record<string, string> = {
  "/dashboard":           "/citizen/dashboard",
  "/authority-dashboard": "/authority/dashboard",
  "/admin-dashboard":     "/admin/dashboard",
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
    if (role === "admin")     return NextResponse.redirect(new URL("/admin/dashboard",     req.url));
    if (role === "authority") return NextResponse.redirect(new URL("/authority/dashboard", req.url));
    return NextResponse.redirect(new URL("/citizen/dashboard", req.url));
  }

  // Legacy redirect aliases
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
