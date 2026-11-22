/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/remote-device-client", () => ({
  sendDeviceSequence: jest.fn(),
}));

import { sendDeviceSequence } from "@/lib/remote-device-client";
import { RemoteError } from "@/lib/remote-errors";
import { POST } from "../route";

const mockSendDeviceSequence = sendDeviceSequence as jest.MockedFunction<
  typeof sendDeviceSequence
>;

const TARGET_URL = "http://localhost:4000/remote";

const createRequest = (
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) =>
  new NextRequest("http://localhost:3000/api/remote/command", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

const successResult = {
  ok: true,
  requestId: "req-1",
  results: [
    {
      command: 1,
      ok: true,
      status: 200,
      durationMs: 10,
      requestId: "req-1:0",
    },
  ],
};

describe("POST /api/remote/command", () => {
  const originalOrigins = process.env.ALLOWED_PROXY_ORIGINS;
  const originalPost = process.env.REMOTE_DEVICE_HTTP_POST;

  beforeEach(() => {
    process.env.ALLOWED_PROXY_ORIGINS = "http://localhost:4000";
    delete process.env.REMOTE_DEVICE_HTTP_POST;
    mockSendDeviceSequence.mockReset();
    mockSendDeviceSequence.mockResolvedValue(successResult);
  });

  afterEach(() => {
    if (originalOrigins === undefined) delete process.env.ALLOWED_PROXY_ORIGINS;
    else process.env.ALLOWED_PROXY_ORIGINS = originalOrigins;
    if (originalPost === undefined) delete process.env.REMOTE_DEVICE_HTTP_POST;
    else process.env.REMOTE_DEVICE_HTTP_POST = originalPost;
  });

  it("sends a sequence through the device client", async () => {
    const res = await POST(
      createRequest({
        targetUrl: TARGET_URL,
        device: "SonyChanger",
        sequence: [{ command: 1, delayAfterMs: 0 }],
        requestId: "req-1",
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(res.headers.get("Pragma")).toBe("no-cache");
    expect(res.headers.get("Expires")).toBe("0");
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockSendDeviceSequence).toHaveBeenCalledWith(
      { url: TARGET_URL },
      "SonyChanger",
      [{ command: 1, delayAfterMs: 0 }],
      "req-1",
      { preferPost: false },
    );
  });

  it("returns 207 when the device rejects part of the sequence", async () => {
    mockSendDeviceSequence.mockResolvedValue({
      ok: false,
      requestId: "req-1",
      results: [
        {
          command: 1,
          ok: false,
          status: 503,
          durationMs: 10,
          requestId: "req-1:0",
          code: "DEVICE_ERROR",
        },
      ],
      code: "DEVICE_ERROR",
    });

    const res = await POST(
      createRequest({
        targetUrl: TARGET_URL,
        device: "SonyChanger",
        command: 1,
        requestId: "req-1",
      }),
    );

    expect(res.status).toBe(207);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("uses POST to the device when requested explicitly", async () => {
    await POST(
      createRequest({
        targetUrl: TARGET_URL,
        device: "SonyChanger",
        command: 1,
        preferPost: true,
      }),
    );

    expect(mockSendDeviceSequence).toHaveBeenCalledWith(
      expect.anything(),
      "SonyChanger",
      [{ command: 1, delayAfterMs: 0 }],
      undefined,
      { preferPost: true },
    );
  });

  it("rejects invalid sequences", async () => {
    const res = await POST(
      createRequest({
        targetUrl: TARGET_URL,
        device: "SonyChanger",
        sequence: [{ command: 99, delayAfterMs: 0 }],
      }),
    );

    expect(res.status).toBe(400);
    expect(mockSendDeviceSequence).not.toHaveBeenCalled();
  });

  it("rejects cross-site requests", async () => {
    const res = await POST(
      createRequest(
        {
          targetUrl: TARGET_URL,
          device: "SonyChanger",
          command: 1,
        },
        { "sec-fetch-site": "cross-site" },
      ),
    );

    expect(res.status).toBe(403);
    expect(mockSendDeviceSequence).not.toHaveBeenCalled();
  });

  it("requires JSON content type", async () => {
    const req = new NextRequest("http://localhost:3000/api/remote/command", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);

    expect(res.status).toBe(415);
  });

  it("maps device errors to the API error shape", async () => {
    mockSendDeviceSequence.mockRejectedValue(
      new RemoteError("DEVICE_OFFLINE", "offline", 503),
    );

    const res = await POST(
      createRequest({
        targetUrl: TARGET_URL,
        device: "SonyChanger",
        command: 1,
      }),
    );

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe("DEVICE_OFFLINE");
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });
});
