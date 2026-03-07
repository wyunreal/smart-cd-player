import { createServer, type Server } from "node:http";

import sharp from "sharp";

import type { DetectionResult } from "./digit-detector.js";
import type { FrameProvider } from "./frame-provider.js";

export type DisplayMode = "stopped" | "playing" | "paused";

export interface DigitState {
  digits: DetectionResult[];
  mode: DisplayMode;
  timestamp: number;
}

export interface DisplayState {
  mode: DisplayMode;
  disc: number | null;
  track: number | null;
  minutes: number | null;
  seconds: number | null;
  timestamp: number;
}

function combineDigits(
  names: string[],
  results: DetectionResult[],
): number | null {
  const byName = new Map(results.map((d) => [d.name, d.digit]));
  let value = 0;
  let hasDigit = false;
  for (const name of names) {
    const digit = byName.get(name);
    if (digit === null || digit === undefined) continue;
    value = value * 10 + digit;
    hasDigit = true;
  }
  return hasDigit ? value : null;
}

export function toDisplayState(state: DigitState): DisplayState {
  return {
    mode: state.mode,
    disc: combineDigits(["disc_1", "disc_2", "disc_3"], state.digits),
    track: combineDigits(["track_1", "track_2"], state.digits),
    minutes: combineDigits(["time_1", "time_2"], state.digits),
    seconds: combineDigits(["time_3", "time_4"], state.digits),
    timestamp: state.timestamp,
  };
}

interface ServerDeps {
  port: number;
  frameProvider: FrameProvider;
  getState: () => DigitState;
  waitForFreshState: () => Promise<DigitState>;
  frameWidth: number;
  frameHeight: number;
  binarizationThreshold: number;
  captureIdleTimeoutMs?: number;
}

const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export function createHttpServer(deps: ServerDeps): Server {
  let capturing = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  const idleTimeoutMs = deps.captureIdleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;

  function resetIdleTimer(): void {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(async () => {
      if (capturing) {
        await deps.frameProvider.stop();
        capturing = false;
        console.log("[capture] stopped (idle timeout)");
      }
    }, idleTimeoutMs);
  }

  async function ensureCapturing(): Promise<void> {
    resetIdleTimer();
    if (!capturing) {
      await deps.frameProvider.start();
      capturing = true;
      console.log("[capture] started (auto)");
    }
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${deps.port}`);

    if (req.method === "POST") {
      switch (url.pathname) {
        case "/capture/start": {
          if (capturing) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "already_running" }));
            return;
          }
          try {
            await deps.frameProvider.start();
            capturing = true;
            console.log("[capture] started");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "started" }));
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: msg }));
          }
          return;
        }

        case "/capture/stop": {
          if (!capturing) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "already_stopped" }));
            return;
          }
          try {
            await deps.frameProvider.stop();
            capturing = false;
            console.log("[capture] stopped");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "stopped" }));
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: msg }));
          }
          return;
        }

        default: {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Not found" }));
          return;
        }
      }
    }

    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    switch (url.pathname) {
      case "/display": {
        try {
          const wasCapturing = capturing;
          await ensureCapturing();
          const state = wasCapturing
            ? deps.getState()
            : await deps.waitForFreshState();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(toDisplayState(state)));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: msg }));
        }
        break;
      }

      case "/frame": {
        try {
          const wasCapturing = capturing;
          await ensureCapturing();
          if (!wasCapturing) {
            await deps.waitForFreshState();
          }
          const frame = deps.frameProvider.getLatestFrame();
          if (!frame) {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "No frame available yet" }));
            return;
          }
          const png = await sharp(frame, {
            raw: {
              width: deps.frameWidth,
              height: deps.frameHeight,
              channels: 3,
            },
          })
            .png()
            .toBuffer();

          res.writeHead(200, {
            "Content-Type": "image/png",
            "Content-Length": png.length,
          });
          res.end(png);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: msg }));
        }
        break;
      }

      case "/frame-filtered": {
        try {
          const wasCapturing = capturing;
          await ensureCapturing();
          if (!wasCapturing) {
            await deps.waitForFreshState();
          }
          const frame = deps.frameProvider.getLatestFrame();
          if (!frame) {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "No frame available yet" }));
            return;
          }
          const pixelCount = deps.frameWidth * deps.frameHeight;
          const gray = Buffer.alloc(pixelCount);
          for (let i = 0; i < pixelCount; i++) {
            const ri = i * 3;
            const minRgb = Math.min(frame[ri], frame[ri + 1], frame[ri + 2]);
            gray[i] = minRgb > deps.binarizationThreshold ? 255 : 0;
          }

          const png = await sharp(gray, {
            raw: {
              width: deps.frameWidth,
              height: deps.frameHeight,
              channels: 1,
            },
          })
            .png()
            .toBuffer();

          res.writeHead(200, {
            "Content-Type": "image/png",
            "Content-Length": png.length,
          });
          res.end(png);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: msg }));
        }
        break;
      }

      case "/health": {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        break;
      }

      default: {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      }
    }
  });

  return server;
}
