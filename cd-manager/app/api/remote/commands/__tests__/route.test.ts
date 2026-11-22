/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/remote-device-client", () => ({
  fetchDeviceCommands: jest.fn(),
}));

import { fetchDeviceCommands } from "@/lib/remote-device-client";
import { GET } from "../route";

const mockFetchDeviceCommands = fetchDeviceCommands as jest.MockedFunction<
  typeof fetchDeviceCommands
>;

const TARGET_URL = "http://localhost:4000/commands";

const createRequest = (query: string) =>
  new NextRequest(
    new URL(`/api/remote/commands${query}`, "http://localhost:3000"),
  );

describe("GET /api/remote/commands", () => {
  const originalOrigins = process.env.ALLOWED_PROXY_ORIGINS;

  beforeEach(() => {
    process.env.ALLOWED_PROXY_ORIGINS = "http://localhost:4000";
    mockFetchDeviceCommands.mockReset();
    mockFetchDeviceCommands.mockResolvedValue({
      commands: ["Sony0", "Sony1"],
      status: 200,
      durationMs: 10,
    });
  });

  afterEach(() => {
    if (originalOrigins === undefined) delete process.env.ALLOWED_PROXY_ORIGINS;
    else process.env.ALLOWED_PROXY_ORIGINS = originalOrigins;
  });

  it("returns 400 when url is missing", async () => {
    const res = await GET(createRequest(""));
    expect(res.status).toBe(400);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(res.headers.get("Pragma")).toBe("no-cache");
    expect(res.headers.get("Expires")).toBe("0");
  });

  it("fetches the command list live on every request", async () => {
    const first = await GET(
      createRequest(`?url=${encodeURIComponent(TARGET_URL)}`),
    );
    const second = await GET(
      createRequest(`?url=${encodeURIComponent(TARGET_URL)}`),
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.headers.get("Cache-Control")).toContain("no-store");
    expect(second.headers.get("Cache-Control")).toContain("no-store");

    const body = await first.json();
    expect(body.commands).toEqual(["Sony0", "Sony1"]);
    expect(body.stale).toBeUndefined();
    expect(body.lastUpdated).toBeUndefined();

    // No cache: both reads hit the device client.
    expect(mockFetchDeviceCommands).toHaveBeenCalledTimes(2);
    expect(mockFetchDeviceCommands).toHaveBeenNthCalledWith(1, {
      url: TARGET_URL,
    });
    expect(mockFetchDeviceCommands).toHaveBeenNthCalledWith(2, {
      url: TARGET_URL,
    });
  });

  it("rejects URLs outside the allowlist", async () => {
    const res = await GET(
      createRequest(`?url=${encodeURIComponent("http://evil.com/commands")}`),
    );

    expect(res.status).toBe(403);
    expect(mockFetchDeviceCommands).not.toHaveBeenCalled();
  });
});
