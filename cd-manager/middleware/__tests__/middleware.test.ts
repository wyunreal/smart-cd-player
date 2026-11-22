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

  it("marks only remote-control API 401 responses as no-store", async () => {
    jest.mock("../../auth", () => ({
      auth: (handler: Function) => handler,
    }));

    jest.resetModules();
    const middleware = await import("../../middleware");
    const handler = middleware.default as unknown as (
      request: unknown,
    ) => Promise<Response>;

    const remoteRequest = {
      auth: null,
      nextUrl: new URL("http://localhost/api/remote/commands?url=x"),
    };
    const remoteResponse = await handler(remoteRequest);

    expect(remoteResponse.status).toBe(401);
    expect(remoteResponse.headers.get("Cache-Control")).toContain("no-store");

    // Other APIs keep their normal caching behaviour.
    const otherRequest = {
      auth: null,
      nextUrl: new URL("http://localhost/api/cds"),
    };
    const otherResponse = await handler(otherRequest);

    expect(otherResponse.status).toBe(401);
    expect(otherResponse.headers.get("Cache-Control")).toBeNull();
  });
});
