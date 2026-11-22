/**
 * @jest-environment node
 */

import http from "node:http";
import type { AddressInfo } from "node:net";

import { __resetDeviceQueues } from "../device-queue";
import {
  fetchDeviceCommands,
  sendDeviceSequence,
} from "../remote-device-client";

type RequestLog = {
  method: string;
  url: string;
};

describe("remote-device-client", () => {
  let server: http.Server;
  let port: number;
  let requests: RequestLog[];
  let handler: (req: http.IncomingMessage, res: http.ServerResponse) => void;

  const endpoint = (path: string) => ({
    id: "device:test",
    url: `http://127.0.0.1:${port}${path}`,
  });

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      requests.push({ method: req.method ?? "", url: req.url ?? "" });
      req.resume();
      handler(req, res);
    });
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    requests = [];
    __resetDeviceQueues();
    handler = (_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "success" }));
    };
  });

  it("fetches the command list with GET /commands", async () => {
    handler = (_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ commands: ["Sony0", "Sony1"] }));
    };

    const result = await fetchDeviceCommands(endpoint("/commands"));

    expect(result.commands).toEqual(["Sony0", "Sony1"]);
    expect(requests).toEqual([{ method: "GET", url: "/commands" }]);
  });

  it("rejects a non-JSON command list", async () => {
    handler = (_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html>not the command endpoint</html>");
    };

    await expect(fetchDeviceCommands(endpoint("/commands"))).rejects.toMatchObject({
      code: "INVALID_DEVICE_RESPONSE",
    });
  });

  it("sends a sequence with GET by default and preserves the order", async () => {
    const result = await sendDeviceSequence(
      endpoint("/remote"),
      "SonyChanger",
      [
        { command: 1, delayAfterMs: 0 },
        { command: 3, delayAfterMs: 5 },
      ],
      "req-1",
    );

    expect(result.ok).toBe(true);
    expect(result.results).toHaveLength(2);
    expect(requests.map((request) => request.method)).toEqual(["GET", "GET"]);
    expect(requests[0].url).toContain("device=SonyChanger");
    expect(requests[0].url).toContain("command=1");
    expect(requests[1].url).toContain("command=3");
    expect(requests[0].url).toContain("requestId=req-1%3A0");
    expect(requests[1].url).toContain("requestId=req-1%3A1");
  });

  it("uses POST when preferPost is enabled", async () => {
    handler = (_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "success", requestId: "x" }));
    };

    const result = await sendDeviceSequence(
      endpoint("/remote"),
      "SonyChanger",
      [{ command: 1, delayAfterMs: 0 }],
      "req-post",
      { preferPost: true },
    );

    expect(result.ok).toBe(true);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("POST");
  });

  it("falls back to GET when POST is not implemented by the firmware", async () => {
    handler = (req, res) => {
      if (req.method === "POST") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<html>index</html>");
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "success" }));
    };

    const result = await sendDeviceSequence(
      endpoint("/remote"),
      "SonyChanger",
      [{ command: 1, delayAfterMs: 0 }],
      "req-fallback",
      { preferPost: true },
    );

    expect(result.ok).toBe(true);
    expect(requests.map((request) => request.method)).toEqual(["POST", "GET"]);
  });

  it("retries the device live after repeated failures instead of opening a breaker", async () => {
    handler = (_req, res) => {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "failure" }));
    };

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect(fetchDeviceCommands(endpoint("/commands"))).rejects.toMatchObject({
        code: "DEVICE_ERROR",
      });
    }

    // There is no circuit breaker: every attempt reaches the device.
    expect(requests).toHaveLength(4);
  });

  it("times out an unresponsive device", async () => {
    handler = () => {
      // Intentionally leave the response open.
    };

    await expect(
      fetchDeviceCommands(endpoint("/commands"), { timeoutMs: 30 }),
    ).rejects.toMatchObject({ code: "DEVICE_TIMEOUT" });
  });
});
