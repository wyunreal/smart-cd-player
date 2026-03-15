/**
 * Regression tests for auth.ts configuration.
 *
 * These tests verify the NextAuth configuration exports are valid
 * and the provider setup is correct. Since NextAuth internals are
 * complex to test in isolation, we focus on the exported config shape
 * and provider map.
 */

// Mock next-auth to avoid complex internal initialization
jest.mock("next-auth", () => {
  return {
    __esModule: true,
    default: (config: Record<string, unknown>) => {
      // Return the config so we can inspect it
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

// Import after mocks
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
    // Re-import to check exports
    const authModule = await import("../../auth");

    expect(authModule.auth).toBeDefined();
    expect(authModule.signIn).toBeDefined();
    expect(authModule.signOut).toBeDefined();
    expect(authModule.handlers).toBeDefined();
  });
});
