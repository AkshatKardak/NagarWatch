import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ─── Public routes (no auth required) ────────────────────────────────────────
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/map(.*)",
  "/complaints(.*)",
  "/unauthorized(.*)",
  "/api/v1/webhooks(.*)",
]);

// ─── Role-gated route prefixes ────────────────────────────────────────────────
const isCitizenRoute    = createRouteMatcher(["/citizen(.*)", "/dashboard(.*)", "/submit(.*)", "/notifications(.*)", "/rti(.*)"]);
const isAuthorityRoute  = createRouteMatcher(["/authority(.*)", "/analytics(.*)"]);
const isAdminRoute      = createRouteMatcher(["/admin(.*)", "/admin-dashboard(.*)", "/users(.*)", "/wards(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // 1. Not signed in → redirect to sign-in (except public routes)
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (!userId) return NextResponse.next();

  // 2. Signed in — read role from Clerk publicMetadata
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role ?? "citizen";

  // 3. Guard role-specific routes
  if (isAdminRoute(req) && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (isAuthorityRoute(req) && role !== "authority" && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (isCitizenRoute(req) && role !== "citizen" && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // 4. Signed-in user hits / → send to their dashboard
  if (req.nextUrl.pathname === "/") {
    if (role === "admin")     return NextResponse.redirect(new URL("/admin-dashboard", req.url));
    if (role === "authority") return NextResponse.redirect(new URL("/authority/dashboard", req.url));
    // citizen (default)
    return NextResponse.redirect(new URL("/citizen/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
