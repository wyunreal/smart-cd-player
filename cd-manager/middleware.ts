import { auth } from "./auth";
import { NextResponse } from "next/server";
import { findRateLimiter } from "./lib/rate-limit.config";

const getClientIp = (headers: Headers): string => {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") || "unknown";
};

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  const isApi = pathname.startsWith("/api");
  const isPublicPage = pathname.startsWith("/public");
  const isAuthPage = pathname.startsWith("/auth");

  // 1. API Route Protection
  if (isApi) {
    // Rate limiting (applied before auth to protect against unauthenticated floods)
    const match = findRateLimiter(pathname);
    if (match) {
      const clientIp = getClientIp(req.headers);
      if (match.limiter.isRateLimited(clientIp)) {
        return NextResponse.json(
          { error: "Too many requests" },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil(match.rule.windowMs / 1000)),
            },
          },
        );
      }
    }

    // Whitelist of public API routes
    const isPublicApi =
      pathname === "/api/health" ||
      pathname.startsWith("/api/auth/signin") ||
      pathname.startsWith("/api/auth/callback") ||
      pathname.startsWith("/api/auth/csrf") ||
      pathname.startsWith("/api/auth/providers") ||
      pathname.startsWith("/api/auth/session") ||
      pathname.startsWith("/api/auth/signout") ||
      pathname.startsWith("/api/auth/error");

    // If it's an API route, NOT in the whitelist, and user is NOT logged in:
    if (!isPublicApi && !isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
