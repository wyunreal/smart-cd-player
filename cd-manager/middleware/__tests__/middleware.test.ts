/**
 * @jest-environment node
 */

import { NextResponse } from "next/server";

/**
 * Regression tests for middleware behavior.
 */

// Mock auth to pass through the handler
jest.mock("../../auth", () => ({
  auth: (handler: Function) => handler,
}));

// Mock NextResponse.json and NextResponse.redirect
jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server");
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      json: jest.fn((body: unknown, init?: ResponseInit) => ({
        body,
        status: init?.status || 200,
        headers: init?.headers || {},
      })),
      redirect: jest.fn((url: URL) => ({ redirectUrl: url.toString() })),
    },
  };
});

function createMockRequest(pathname: string, options?: { isLoggedIn?: boolean; ip?: string }) {
  return {
    nextUrl: {
      pathname,
      search: "",
      origin: "http://localhost:3000",
    },
    auth: options?.isLoggedIn ? { user: { email: "test@test.com" } } : null,
    headers: new Map([
      ["x-forwarded-for", options?.ip || "127.0.0.1"],
    ]) as unknown as Headers,
  };
}

describe("middleware configuration", () => {
  it("exports the correct matcher config", async () => {
    const middleware = await import("../../middleware");

    expect(middleware.config).toBeDefined();
    expect(middleware.config.matcher).toBeDefined();
    expect(Array.isArray(middleware.config.matcher)).toBe(true);

    const matcherPattern = middleware.config.matcher[0];
    expect(matcherPattern).toContain("_next/static");
    expect(matcherPattern).toContain("_next/image");
    expect(matcherPattern).toContain(".png");
  });

  it("middleware handler is a function", async () => {
    const middleware = await import("../../middleware");
    expect(typeof middleware.default).toBe("function");
  });
});

describe("middleware auth", () => {
  let middleware: typeof import("../../middleware");

  beforeAll(async () => {
    middleware = await import("../../middleware");
  });

  it("allows public API routes without auth", () => {
    const publicPaths = [
      "/api/health",
      "/api/auth/signin",
      "/api/auth/callback/google",
      "/api/auth/csrf",
      "/api/auth/providers",
      "/api/auth/session",
      "/api/auth/signout",
      "/api/auth/error",
    ];

    for (const path of publicPaths) {
      const req = createMockRequest(path, { isLoggedIn: false });
      const result = middleware.default(req as any);
      // Public routes should not return 401
      expect(result?.status).not.toBe(401);
    }
  });

  it("returns 401 for protected API routes without auth", () => {
    const protectedPaths = ["/api/cds", "/api/discogs/search", "/api/proxy-remote", "/api/display"];

    for (const path of protectedPaths) {
      const req = createMockRequest(path, { isLoggedIn: false });
      middleware.default(req as any);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }
  });

  it("allows protected API routes with auth", () => {
    const req = createMockRequest("/api/cds", { isLoggedIn: true });
    const result = middleware.default(req as any);
    expect(result).toBeUndefined();
  });
});

describe("middleware rate limiting", () => {
  it("returns 429 when rate limit is exceeded", async () => {
    // Reset modules to get fresh rate limiter state
    jest.resetModules();
    jest.mock("../../auth", () => ({
      auth: (handler: Function) => handler,
    }));
    jest.mock("next/server", () => {
      const actual = jest.requireActual("next/server");
      return {
        ...actual,
        NextResponse: {
          ...actual.NextResponse,
          json: jest.fn((body: unknown, init?: ResponseInit) => ({
            body,
            status: init?.status || 200,
            headers: init?.headers || {},
          })),
          redirect: jest.fn((url: URL) => ({ redirectUrl: url.toString() })),
        },
      };
    });

    const { findRateLimiter } = await import("../../lib/rate-limit.config");
    const freshMiddleware = await import("../../middleware");

    // Find the rate limit for /api/auth (20 req/min)
    const match = findRateLimiter("/api/auth/signin");
    expect(match).toBeDefined();

    // Exhaust the limit
    for (let i = 0; i < match!.rule.maxRequests; i++) {
      const req = createMockRequest("/api/auth/signin", { ip: "10.0.0.99" });
      freshMiddleware.default(req as any);
    }

    // Next request should be rate limited
    const req = createMockRequest("/api/auth/signin", { ip: "10.0.0.99" });
    freshMiddleware.default(req as any);

    const { NextResponse: MockedResponse } = await import("next/server");
    expect(MockedResponse.json).toHaveBeenCalledWith(
      { error: "Too many requests" },
      expect.objectContaining({ status: 429 }),
    );
  });

  it("does not rate limit different IPs independently", async () => {
    jest.resetModules();
    jest.mock("../../auth", () => ({
      auth: (handler: Function) => handler,
    }));
    jest.mock("next/server", () => {
      const actual = jest.requireActual("next/server");
      return {
        ...actual,
        NextResponse: {
          ...actual.NextResponse,
          json: jest.fn((body: unknown, init?: ResponseInit) => ({
            body,
            status: init?.status || 200,
            headers: init?.headers || {},
          })),
          redirect: jest.fn((url: URL) => ({ redirectUrl: url.toString() })),
        },
      };
    });

    const { findRateLimiter } = await import("../../lib/rate-limit.config");
    const freshMiddleware = await import("../../middleware");

    const match = findRateLimiter("/api/auth/signin");
    expect(match).toBeDefined();

    // Exhaust limit for IP A
    for (let i = 0; i < match!.rule.maxRequests; i++) {
      const req = createMockRequest("/api/auth/signin", { ip: "10.0.0.50" });
      freshMiddleware.default(req as any);
    }

    // IP B should still be allowed
    const req = createMockRequest("/api/auth/signin", { isLoggedIn: false, ip: "10.0.0.51" });
    const result = freshMiddleware.default(req as any);
    // Should not be 429 (might be undefined for public route or auth response)
    expect(result?.status).not.toBe(429);
  });
});
