import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes — accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/map(.*)",
  "/complaints(.*)",
  "/contractors(.*)",
  "/analytics(.*)",
  "/unauthorized(.*)",
  "/api/webhooks(.*)",
  "/api/v1/webhooks(.*)",
]);

// Role-gated route matchers
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAuthorityRoute = createRouteMatcher(["/authority(.*)"]);
const isContractorRoute = createRouteMatcher(["/contractor(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Unauthenticated user attempting to access protected route
  if (!userId && !isPublicRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  if (!userId) return NextResponse.next();

  const role =
    (sessionClaims?.metadata as { role?: string } | undefined)?.role || "citizen";

  // Role guards
  if (isAdminRoute(req) && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (isAuthorityRoute(req) && role !== "authority" && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (isContractorRoute(req) && role !== "contractor" && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Handle generic /dashboard navigation by routing to role-specific dashboard
  if (req.nextUrl.pathname === "/dashboard") {
    if (role === "admin") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    if (role === "authority") return NextResponse.redirect(new URL("/authority/dashboard", req.url));
    if (role === "contractor") return NextResponse.redirect(new URL("/contractor/dashboard", req.url));
    return NextResponse.redirect(new URL("/citizen/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
