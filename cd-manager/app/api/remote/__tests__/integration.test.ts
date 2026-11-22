/**
 * @jest-environment node
 */

import { promises as fs } from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";

import { GET as getCommands } from "@/app/api/remote/commands/route";
import { POST as postCommand } from "@/app/api/remote/command/route";
import { __resetDeviceQueues } from "@/lib/device-queue";

type DeviceRequest = {
  method: string;
  url: string;
};

describe("remote-control integration", () => {
  let server: http.Server;
  let port: number;
  let requests: DeviceRequest[];
  let activeRequests: number;
  let maxActiveRequests: number;
  let tempDir: string;

  const originalOrigins = process.env.ALLOWED_PROXY_ORIGINS;
  const originalDataDir = process.env.DATA_DIR;

  const baseUrl = () => `http://127.0.0.1:${port}`;

  const createCommandsRequest = () =>
    new NextRequest(
      new URL(
        `/api/remote/commands?url=${encodeURIComponent(`${baseUrl()}/commands`)}`,
        "http://localhost:3000",
      ),
    );

  const createCommandRequest = (
    sequence: { command: number; delayAfterMs: number }[],
    requestId: string,
  ) =>
    new NextRequest("http://localhost:3000/api/remote/command", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetUrl: `${baseUrl()}/remote`,
        device: "SonyChanger",
        sequence,
        requestId,
      }),
    });

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      activeRequests += 1;
      maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
      requests.push({ method: req.method ?? "", url: req.url ?? "" });
      res.on("finish", () => {
        activeRequests -= 1;
      });
      req.resume();

      if (req.url?.startsWith("/commands")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            commands: ["SonyChanger0", "SonyChanger1", "SonyChanger3"],
          }),
        );
        return;
      }

      // Add a small delay so the integration test can detect overlapping
      // requests if the queue ever regresses.
      setTimeout(() => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success" }));
      }, 10);
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

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "remote-integration-"));
    process.env.DATA_DIR = tempDir;
    process.env.ALLOWED_PROXY_ORIGINS = baseUrl();
    requests = [];
    activeRequests = 0;
    maxActiveRequests = 0;
    __resetDeviceQueues();
  });

  afterEach(async () => {
    if (originalDataDir === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = originalDataDir;
    if (originalOrigins === undefined) delete process.env.ALLOWED_PROXY_ORIGINS;
    else process.env.ALLOWED_PROXY_ORIGINS = originalOrigins;
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("loads the command list live on every request (no cache)", async () => {
    for (let index = 0; index < 2; index += 1) {
      const response = await getCommands(createCommandsRequest());
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.commands).toEqual([
        "SonyChanger0",
        "SonyChanger1",
        "SonyChanger3",
      ]);
      expect(body.stale).toBeUndefined();
    }

    // Both reads must reach the fake device.
    expect(requests.filter((request) => request.url.startsWith("/commands"))).toHaveLength(2);
  });

  it("emits every repeated command request (no command cache)", async () => {
    for (let i = 0; i < 2; i += 1) {
      const response = await postCommand(
        createCommandRequest([{ command: 0, delayAfterMs: 0 }], `power-${i}`),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toContain("no-store");
    }

    expect(requests.filter((request) => request.url.startsWith("/remote"))).toHaveLength(2);
  });

  it("serializes concurrent command sequences for the same device", async () => {
    const responses = await Promise.all(
      Array.from({ length: 4 }, (_, index) =>
        postCommand(
          createCommandRequest(
            [
              { command: 1, delayAfterMs: 0 },
              { command: 3, delayAfterMs: 0 },
            ],
            `sequence-${index}`,
          ),
        ),
      ),
    );

    for (const response of responses) {
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
    }

    expect(maxActiveRequests).toBe(1);
    expect(requests.filter((request) => request.url.startsWith("/remote"))).toHaveLength(8);
  });
});
