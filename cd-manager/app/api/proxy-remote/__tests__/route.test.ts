/**
 * @jest-environment node
 */

import { GET } from "../route";
import { NextRequest } from "next/server";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const createRequest = (url: string): NextRequest => {
  return new NextRequest(new URL(url, "http://localhost:3000"));
};

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

  it("proxies a successful request and returns the body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify({ status: "success", commands: [] }),
    });

    const targetUrl = "http://192.168.1.100:4000/commands";
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(targetUrl);
    const body = await res.json();
    expect(body.status).toBe("success");
  });

  it("forwards error status from remote server", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const targetUrl = "http://192.168.1.100:4000/nonexistent";
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("Remote error");
  });

  it("returns 500 when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const targetUrl = "http://192.168.1.100:4000/commands";
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();

    consoleSpy.mockRestore();
  });

  it("returns the correct content-type from remote", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "text/plain" }),
      text: async () => "OK",
    });

    const targetUrl = "http://192.168.1.100:4000/emit";
    const req = createRequest(
      `/api/proxy-remote?url=${encodeURIComponent(targetUrl)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/plain");
  });
});
