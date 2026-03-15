/**
 * Regression tests for auth.ts configuration.
 */

// Capture the config passed to NextAuth
let capturedConfig: Record<string, any> = {};

jest.mock("next-auth", () => {
  return {
    __esModule: true,
    default: (config: Record<string, unknown>) => {
      capturedConfig = config;
      return {
        handlers: { GET: jest.fn(), POST: jest.fn() },
        auth: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        _config: config,
      };
    },
  };
});

jest.mock("next-auth/providers/google", () => {
  return {
    __esModule: true,
    default: (config: Record<string, unknown>) => ({
      id: "google",
      name: "Google",
      type: "oauth",
      _config: config,
    }),
  };
});

import { providerMap } from "../../auth";

describe("auth configuration", () => {
  it("exports a provider map with Google provider", () => {
    expect(providerMap).toBeDefined();
    expect(Array.isArray(providerMap)).toBe(true);
    expect(providerMap.length).toBeGreaterThanOrEqual(1);

    const google = providerMap.find((p) => p.id === "google");
    expect(google).toBeDefined();
    expect(google!.name).toBe("Google");
  });

  it("exports auth, signIn, signOut, and handlers", async () => {
    const authModule = await import("../../auth");

    expect(authModule.auth).toBeDefined();
    expect(authModule.signIn).toBeDefined();
    expect(authModule.signOut).toBeDefined();
    expect(authModule.handlers).toBeDefined();
  });

  // --- NEW: Session configuration tests ---

  it("configures JWT session with maxAge of 7 days or less", () => {
    const session = capturedConfig.session as { maxAge: number };
    expect(session).toBeDefined();
    expect(session.maxAge).toBeLessThanOrEqual(7 * 24 * 60 * 60);
  });

  it("configures session token rotation via updateAge", () => {
    const session = capturedConfig.session as { updateAge?: number };
    expect(session.updateAge).toBeDefined();
    expect(session.updateAge).toBeLessThanOrEqual(24 * 60 * 60);
  });

  // --- NEW: Callback tests ---

  it("has a signIn callback for email allowlist", () => {
    const callbacks = capturedConfig.callbacks as Record<string, Function>;
    expect(callbacks.signIn).toBeDefined();
    expect(typeof callbacks.signIn).toBe("function");
  });

  it("signIn callback rejects all when ALLOWED_EMAILS is not set", async () => {
    delete process.env.ALLOWED_EMAILS;
    const callbacks = capturedConfig.callbacks as Record<string, Function>;
    const result = await callbacks.signIn({
      user: { email: "anyone@gmail.com" },
    });
    expect(result).toBe(false);
  });

  it("signIn callback rejects all when ALLOWED_EMAILS is empty string", async () => {
    process.env.ALLOWED_EMAILS = "";
    const callbacks = capturedConfig.callbacks as Record<string, Function>;
    const result = await callbacks.signIn({
      user: { email: "anyone@gmail.com" },
    });
    expect(result).toBe(false);
  });

  it("signIn callback rejects emails not in ALLOWED_EMAILS", async () => {
    process.env.ALLOWED_EMAILS = "allowed@gmail.com,admin@example.com";
    const callbacks = capturedConfig.callbacks as Record<string, Function>;
    const result = await callbacks.signIn({
      user: { email: "hacker@evil.com" },
    });
    expect(result).toBe(false);
  });

  it("signIn callback accepts emails in ALLOWED_EMAILS", async () => {
    process.env.ALLOWED_EMAILS = "allowed@gmail.com,admin@example.com";
    const callbacks = capturedConfig.callbacks as Record<string, Function>;
    const result = await callbacks.signIn({
      user: { email: "allowed@gmail.com" },
    });
    expect(result).toBe(true);
  });

  it("authorized callback does NOT bypass auth for API routes", () => {
    const callbacks = capturedConfig.callbacks as Record<string, Function>;
    // Simulate an unauthenticated request to an API route
    const result = callbacks.authorized({
      auth: null, // not logged in
      request: { nextUrl: { pathname: "/api/cds" } },
    });
    expect(result).toBe(false);
  });

  it("authorized callback allows authenticated users", () => {
    const callbacks = capturedConfig.callbacks as Record<string, Function>;
    const result = callbacks.authorized({
      auth: { user: { email: "test@test.com" } },
      request: { nextUrl: { pathname: "/dashboard" } },
    });
    expect(result).toBe(true);
  });

  it("authorized callback allows public pages without auth", () => {
    const callbacks = capturedConfig.callbacks as Record<string, Function>;
    const result = callbacks.authorized({
      auth: null,
      request: { nextUrl: { pathname: "/public/something" } },
    });
    expect(result).toBe(true);
  });

  it("authorized callback allows auth pages without auth", () => {
    const callbacks = capturedConfig.callbacks as Record<string, Function>;
    const result = callbacks.authorized({
      auth: null,
      request: { nextUrl: { pathname: "/auth/signin" } },
    });
    expect(result).toBe(true);
  });
});
