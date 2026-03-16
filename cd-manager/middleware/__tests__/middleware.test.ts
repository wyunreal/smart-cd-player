/**
 * @jest-environment node
 */

/**
 * Regression tests for middleware behavior.
 */

describe("middleware configuration", () => {
  it("exports the correct matcher config", async () => {
    jest.mock("../../auth", () => ({
      auth: (handler: Function) => {
        const wrapped = (req: unknown) => handler(req);
        return wrapped;
      },
    }));

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
    jest.mock("../../auth", () => ({
      auth: (handler: Function) => handler,
    }));

    jest.resetModules();
    const middleware = await import("../../middleware");
    expect(typeof middleware.default).toBe("function");
  });
});
