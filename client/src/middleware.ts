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
]);

// Role-gated prefixes (matching actual file-system routes)
const isCitizenRoute   = createRouteMatcher(["/citizen(.*)", "/dashboard(.*)", "/notifications(.*)", "/rti(.*)"]);
const isAuthorityRoute = createRouteMatcher(["/authority(.*)", "/analytics(.*)"]);
const isAdminRoute     = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Not signed in → redirect to sign-in (except public routes)
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (!userId) return NextResponse.next();

  // Read role from Clerk publicMetadata (set by webhook on user.created)
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role ?? "citizen";

  // Guard role-specific routes
  if (isAdminRoute(req) && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (isAuthorityRoute(req) && role !== "authority" && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (isCitizenRoute(req) && role !== "citizen" && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Signed-in user hits / → send to correct dashboard
  if (req.nextUrl.pathname === "/") {
    if (role === "admin")     return NextResponse.redirect(new URL("/admin/dashboard",     req.url));
    if (role === "authority") return NextResponse.redirect(new URL("/authority/dashboard", req.url));
    return NextResponse.redirect(new URL("/citizen/dashboard", req.url));
  }

  // Legacy redirect aliases so old links still work
  const legacyMap: Record<string, string> = {
    "/dashboard":           "/citizen/dashboard",
    "/authority-dashboard": "/authority/dashboard",
    "/admin-dashboard":     "/admin/dashboard",
  };
  const legacy = legacyMap[req.nextUrl.pathname];
  if (legacy) return NextResponse.redirect(new URL(legacy, req.url));

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
