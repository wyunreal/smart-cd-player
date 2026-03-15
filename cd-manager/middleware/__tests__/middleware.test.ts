/**
 * @jest-environment node
 */

/**
 * Regression tests for middleware behavior.
 *
 * Since the middleware wraps NextAuth's auth() function which is complex
 * to mock in isolation, these tests verify the middleware module exports
 * correctly and has the expected matcher configuration.
 */

describe("middleware configuration", () => {
  it("exports the correct matcher config", async () => {
    // We need to mock the auth import before importing middleware
    jest.mock("../../auth", () => ({
      auth: (handler: Function) => {
        // Return the handler itself wrapped in a simple function
        const wrapped = (req: unknown) => handler(req);
        return wrapped;
      },
    }));

    const middleware = await import("../../middleware");

    expect(middleware.config).toBeDefined();
    expect(middleware.config.matcher).toBeDefined();
    expect(Array.isArray(middleware.config.matcher)).toBe(true);

    // The matcher should exclude _next/static, _next/image, and .png files
    const matcherPattern = middleware.config.matcher[0];
    expect(matcherPattern).toContain("_next/static");
    expect(matcherPattern).toContain("_next/image");
    expect(matcherPattern).toContain(".png");
  });

  it("middleware handler is a function", async () => {
    jest.mock("../../auth", () => ({
      auth: (handler: Function) => handler,
    }));

    jest.resetModules();
    const middleware = await import("../../middleware");
    expect(typeof middleware.default).toBe("function");
  });
});
