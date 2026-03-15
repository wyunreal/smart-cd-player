/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const ALLOWED_ORIGIN = "http://192.168.1.100:4000";

const createRequest = (url: string): NextRequest => {
  return new NextRequest(new URL(url, "http://localhost:3000"));
};

// Set allowed origins before importing the route
beforeAll(() => {
  process.env.ALLOWED_PROXY_ORIGINS = ALLOWED_ORIGIN;
});

// Lazy import so env is set before module loads
let GET: typeof import("../route").GET;
beforeAll(async () => {
  const mod = await import("../route");
  GET = mod.GET;
});

describe("proxy-remote route", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("returns 400 when url parameter is missing", async () => {
    const req = createRequest("/api/proxy-remote");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing url parameter");
  });

  it("proxies a successful request to an allowed origin", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify({ status: "success", commands: [] }),
    });

    const targetUrl = `${ALLOWED_ORIGIN}/commands`;
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(targetUrl);
    const body = await res.json();
    expect(body.status).toBe("success");
  });

  // --- NEW: SSRF protection tests ---

  it("returns 403 for a URL whose origin is not in the allowlist", async () => {
    const targetUrl = "http://evil.com/steal-data";
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(mockFetch).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.error).toContain("not allowed");
  });

  it("returns 403 for internal metadata URLs (SSRF vector)", async () => {
    const targetUrl =
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/";
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 403 for file:// scheme URLs", async () => {
    const targetUrl = "file:///etc/passwd";
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // --- END SSRF tests ---

  it("forwards error status from remote server", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const targetUrl = `${ALLOWED_ORIGIN}/nonexistent`;
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("Remote error");
  });

  it("returns 500 without leaking error details when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const targetUrl = `${ALLOWED_ORIGIN}/commands`;
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
    // Should NOT contain internal error details
    expect(body.details).toBeUndefined();
    expect(body.debug).toBeUndefined();

    consoleSpy.mockRestore();
  });

  it("does not include Access-Control-Allow-Origin wildcard", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify({ ok: true }),
    });

    const targetUrl = `${ALLOWED_ORIGIN}/emit`;
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).not.toBe("*");
  });

  it("returns the correct content-type from remote", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "text/plain" }),
      text: async () => "OK",
    });

    const targetUrl = `${ALLOWED_ORIGIN}/emit`;
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/plain");
  });
});
