import { auth } from "./auth";
import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "./lib/api-response";

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  const isApi = pathname.startsWith("/api");
  const isPublicPage = pathname.startsWith("/public");
  const isAuthPage = pathname.startsWith("/auth");

  // 1. API Route Protection
  if (isApi) {
    // Whitelist of public API routes
    const isPublicApi =
      pathname === "/api/health" ||
      pathname.startsWith("/api/images/") ||
      pathname.startsWith("/api/auth/signin") ||
      pathname.startsWith("/api/auth/callback") ||
      pathname.startsWith("/api/auth/csrf") ||
      pathname.startsWith("/api/auth/providers") ||
      pathname.startsWith("/api/auth/session") ||
      pathname.startsWith("/api/auth/signout") ||
      pathname.startsWith("/api/auth/error");

    // Only the remote-controller API must be uncacheable. Everything else
    // keeps its normal web/API caching behaviour.
    const isRemoteControlApi =
      pathname === "/api/remote" ||
      pathname.startsWith("/api/remote/") ||
      pathname === "/api/proxy-remote";

    // If it's an API route, NOT in the whitelist, and user is NOT logged in:
    if (!isPublicApi && !isLoggedIn) {
      // Never let an unauthenticated remote-control 401 be cached and then
      // served to a logged-in user: that would make the remote look offline.
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          ...(isRemoteControlApi ? { headers: NO_STORE_HEADERS } : {}),
        },
      );
    }
    // Allow API request to continue
    return;
  }

  // 2. Page Route Protection
  // If it's not a public page, not an auth page (login), and user is not logged in:
  if (!isPublicPage && !isAuthPage && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${callbackUrl}`, nextUrl),
    );
  }

  // Allow page request to continue
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
