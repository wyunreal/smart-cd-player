/**
 * @jest-environment node
 */

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { GET } from "../route";

describe("display route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    mockFetch.mockClear();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 503 when COMPOSITE_VIDEO_PARSER_URL is not configured", async () => {
    delete process.env.COMPOSITE_VIDEO_PARSER_URL;

    const res = await GET();

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns display data when upstream responds successfully", async () => {
    process.env.COMPOSITE_VIDEO_PARSER_URL = "http://parser:8080";
    const displayData = { track: 1, time: "02:30", state: "playing" };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => displayData,
    });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith("http://parser:8080/display");
    const body = await res.json();
    expect(body).toEqual(displayData);
  });

  it("forwards error status from upstream", async () => {
    process.env.COMPOSITE_VIDEO_PARSER_URL = "http://parser:8080";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
    });

    const res = await GET();

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 500 when fetch throws a network error", async () => {
    process.env.COMPOSITE_VIDEO_PARSER_URL = "http://parser:8080";

    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const res = await GET();

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();

    consoleSpy.mockRestore();
  });
});
