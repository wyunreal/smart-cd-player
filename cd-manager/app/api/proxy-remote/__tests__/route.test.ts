/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// The proxy now uses the self-contained resolver instead of NSS/Avahi.
jest.mock("@/lib/remote-resolver");
import { resolveUrlToIp } from "@/lib/remote-resolver";

const mockResolveUrlToIp = resolveUrlToIp as jest.MockedFunction<
  typeof resolveUrlToIp
>;
const ALLOWED_ORIGIN = "http://192.168.1.100:4000";

const createRequest = (url: string): NextRequest => {
  return new NextRequest(new URL(url, "http://localhost:3000"));
};

// Set allowed origins before importing the route
beforeAll(() => {
  process.env.ALLOWED_PROXY_ORIGINS = ALLOWED_ORIGIN;
});

beforeEach(() => {
  mockFetch.mockReset();
  mockResolveUrlToIp.mockReset();
  mockResolveUrlToIp.mockImplementation(async (url: string) =>
    url.replace("smartcdplayer.local", "192.168.1.50"),
  );
});

// Lazy import so env is set before module loads
let GET: typeof import("../route").GET;
beforeAll(async () => {
  const mod = await import("../route");
  GET = mod.GET;
});

const jsonResponse = (
  body: unknown,
  init: { ok?: boolean; status?: number; statusText?: string; contentType?: string } = {},
) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  statusText: init.statusText ?? "",
  headers: new Headers({
    "content-type": init.contentType ?? "application/json",
  }),
  text: async () => JSON.stringify(body),
});

describe("proxy-remote route", () => {
  it("returns 400 when url parameter is missing", async () => {
    const req = createRequest("/api/proxy-remote");
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    const body = await res.json();
    expect(body.error).toBe("Missing url parameter");
  });

  it("proxies a successful request to an allowed origin", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ status: "success", commands: [] }),
    );

    const targetUrl = `${ALLOWED_ORIGIN}/commands`;
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      targetUrl,
      expect.objectContaining({ signal: expect.anything() }),
    );
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    const body = await res.json();
    expect(body.status).toBe("success");
  });

  it("resolves .local hostnames before the first fetch", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ commands: ["Sony0"] }),
    );

    const targetUrl = "http://smartcdplayer.local/commands";
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockResolveUrlToIp).toHaveBeenCalledWith(targetUrl);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://192.168.1.50/commands",
      expect.objectContaining({ signal: expect.anything() }),
    );
    const body = await res.json();
    expect(body.commands).toEqual(["Sony0"]);
  });

  it("retries a failing .local request with a fresh resolution", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse({ commands: [] }));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const targetUrl = "http://smartcdplayer.local/commands";
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockResolveUrlToIp).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "http://192.168.1.50/commands",
      expect.objectContaining({ signal: expect.anything() }),
    );

    consoleSpy.mockRestore();
  });

  it("returns 403 for a URL whose origin is not in the allowlist", async () => {
    const targetUrl = "http://evil.com/steal-data";
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(res.headers.get("Cache-Control")).toContain("no-store");
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

  it("forwards error status from remote server", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: "Not Found" }, { ok: false, status: 404, statusText: "Not Found" }),
    );

    const targetUrl = `${ALLOWED_ORIGIN}/nonexistent`;
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("Remote error");
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns 502 without leaking error details when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const targetUrl = `${ALLOWED_ORIGIN}/commands`;
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.details).toBeUndefined();
    expect(body.debug).toBeUndefined();
    expect(res.headers.get("Cache-Control")).toContain("no-store");

    consoleSpy.mockRestore();
  });

  it("does not include Access-Control-Allow-Origin wildcard", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));

    const targetUrl = `${ALLOWED_ORIGIN}/emit`;
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).not.toBe("*");
  });

  it("returns the correct content-type from remote", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse("OK", { contentType: "text/plain" }),
    );

    const targetUrl = `${ALLOWED_ORIGIN}/emit`;
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/plain");
  });
});
