import { createServer, type Server, type ServerResponse } from "node:http";

import sharp from "sharp";

import type { DigitState, DisplayMode, DigitStream } from "./digit-stream.js";
import type { DetectionResult } from "./digit-detector.js";

export type { DigitState, DisplayMode } from "./digit-stream.js";

export interface DisplayState {
  mode: DisplayMode;
  disc: number | null;
  track: number | null;
  minutes: number | null;
  seconds: number | null;
  timestamp: number;
}

export type StreamStatus = "ok" | "starting" | "stale" | "error";

export interface StreamReading extends DisplayState {
  status: StreamStatus;
  error?: string;
}

export type DisplayResponse = Record<string, StreamReading>;

interface ServerDeps {
  port: number;
  streams: DigitStream[];
  binarizationThreshold: number;
  captureIdleTimeoutMs?: number;
  staleAfterMs?: number;
}

const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_STALE_AFTER_MS = 5000;
const FRESH_STATE_TIMEOUT_MS = 2000;
const FRAME_WAIT_TIMEOUT_MS = 2000;

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

const sendJson = (
  res: ServerResponse,
  status: number,
  body: unknown,
): void => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
};

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | null> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export function createHttpServer(deps: ServerDeps): Server {
  const streamById = new Map(deps.streams.map((stream) => [stream.id, stream]));
  const streamIds = deps.streams.map((stream) => stream.id);
  const capturing = new Map<string, boolean>(
    deps.streams.map((stream) => [stream.id, false]),
  );

  const idleTimeoutMs = deps.captureIdleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
  const staleAfterMs = deps.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;

  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const stopAll = async (): Promise<void> => {
    for (const stream of deps.streams) {
      if (!capturing.get(stream.id)) continue;
      try {
        await stream.stop();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[capture] failed to stop ${stream.id}: ${msg}`);
      }
      capturing.set(stream.id, false);
    }
  };

  const resetIdleTimer = (): void => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      void stopAll().then(() => {
        console.log("[capture] stopped (idle timeout)");
      });
    }, idleTimeoutMs);
    idleTimer.unref();
  };

  const ensureCapturing = async (
    streams: DigitStream[],
  ): Promise<DigitStream[]> => {
    const started: DigitStream[] = [];
    for (const stream of streams) {
      if (capturing.get(stream.id)) continue;
      try {
        await stream.start();
        capturing.set(stream.id, true);
        started.push(stream);
        console.log(`[capture] started ${stream.id}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        capturing.set(stream.id, false);
        console.error(`[capture] failed to start ${stream.id}: ${msg}`);
      }
    }
    resetIdleTimer();
    return started;
  };

  const waitForStates = async (streams: DigitStream[]): Promise<void> => {
    const pending = streams.filter(
      (stream) =>
        stream.getState().timestamp === 0 && !stream.getLastError(),
    );
    if (pending.length === 0) return;
    await withTimeout(
      Promise.all(pending.map((stream) => stream.waitForFreshState())),
      FRESH_STATE_TIMEOUT_MS,
    );
  };

  const getStatus = (stream: DigitStream): StreamStatus => {
    if (stream.getLastError()) return "error";
    const lastFrameAt = stream.getLastFrameAt();
    if (lastFrameAt === 0) return "starting";
    if (Date.now() - lastFrameAt > staleAfterMs) return "stale";
    return "ok";
  };

  const buildReading = (stream: DigitStream): StreamReading => {
    const status = getStatus(stream);
    const state = stream.getState();

    if (status === "error" || status === "starting") {
      return {
        status,
        ...(status === "error"
          ? { error: stream.getLastError() ?? "stream unavailable" }
          : {}),
        mode: "off",
        disc: null,
        track: null,
        minutes: null,
        seconds: null,
        timestamp: status === "error" ? 0 : state.timestamp,
      };
    }

    return { status, ...toDisplayState(state) };
  };

  const buildDisplayResponse = (): DisplayResponse => {
    const response: DisplayResponse = {};
    for (const stream of deps.streams) {
      response[stream.id] = buildReading(stream);
    }
    return response;
  };

  const resolveRequestedStreams = (
    url: URL,
  ):
    | { streams: DigitStream[] }
    | { error: string; availableStreams: string[] } => {
    const id = url.searchParams.get("id");
    if (!id) return { streams: deps.streams };

    const stream = streamById.get(id);
    if (!stream) {
      return { error: "Unknown stream", availableStreams: streamIds };
    }
    return { streams: [stream] };
  };

  const resolveFrameStream = (
    url: URL,
  ):
    | { stream: DigitStream }
    | { error: string; availableStreams: string[] } => {
    const id = url.searchParams.get("id");
    if (id) {
      const stream = streamById.get(id);
      if (!stream) {
        return { error: "Unknown stream", availableStreams: streamIds };
      }
      return { stream };
    }

    if (deps.streams.length === 1) {
      return { stream: deps.streams[0] };
    }

    return {
      error: "Multiple streams configured; pass ?id=<stream>",
      availableStreams: streamIds,
    };
  };

  const sendPng = async (
    res: ServerResponse,
    frame: Buffer,
    width: number,
    height: number,
    filtered: boolean,
  ): Promise<void> => {
    let input = frame;
    let channels: 1 | 2 | 3 | 4 = 3;

    if (filtered) {
      const pixelCount = width * height;
      const gray = Buffer.alloc(pixelCount);
      for (let i = 0; i < pixelCount; i++) {
        const ri = i * 3;
        const minRgb = Math.min(frame[ri], frame[ri + 1], frame[ri + 2]);
        gray[i] = minRgb > deps.binarizationThreshold ? 255 : 0;
      }
      input = gray;
      channels = 1;
    }

    const png = await sharp(input, {
      raw: { width, height, channels },
    })
      .png()
      .toBuffer();

    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": png.length,
    });
    res.end(png);
  };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${deps.port}`);

    if (req.method === "POST") {
      switch (url.pathname) {
        case "/capture/start": {
          const selected = resolveRequestedStreams(url);
          if ("error" in selected) {
            sendJson(res, 404, selected);
            return;
          }

          const alreadyRunning = selected.streams.every((stream) =>
            capturing.get(stream.id),
          );
          try {
            await ensureCapturing(selected.streams);
            sendJson(res, 200, {
              status: alreadyRunning ? "already_running" : "started",
              streams: selected.streams.map((stream) => stream.id),
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            sendJson(res, 500, { error: msg });
          }
          return;
        }

        case "/capture/stop": {
          const selected = resolveRequestedStreams(url);
          if ("error" in selected) {
            sendJson(res, 404, selected);
            return;
          }

          const anyRunning = selected.streams.some((stream) =>
            capturing.get(stream.id),
          );
          try {
            for (const stream of selected.streams) {
              if (!capturing.get(stream.id)) continue;
              await stream.stop();
              capturing.set(stream.id, false);
              console.log(`[capture] stopped ${stream.id}`);
            }
            resetIdleTimer();
            sendJson(res, 200, {
              status: anyRunning ? "stopped" : "already_stopped",
              streams: selected.streams.map((stream) => stream.id),
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            sendJson(res, 500, { error: msg });
          }
          return;
        }

        default: {
          sendJson(res, 404, { error: "Not found" });
          return;
        }
      }
    }

    if (req.method !== "GET") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    switch (url.pathname) {
      case "/display": {
        try {
          await ensureCapturing(deps.streams);
          await waitForStates(deps.streams);
          sendJson(res, 200, buildDisplayResponse());
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          sendJson(res, 500, { error: msg });
        }
        return;
      }

      case "/display/": {
        sendJson(res, 404, { error: "Not found" });
        return;
      }

      case "/streams": {
        const response: Record<string, unknown> = {};
        for (const stream of deps.streams) {
          response[stream.id] = {
            captureId: stream.capture.id,
            ...(stream.capture.device
              ? { device: stream.capture.device }
              : { url: stream.capture.url }),
            width: stream.width,
            height: stream.height,
            fps: stream.capture.fps,
            capturing: capturing.get(stream.id) ?? false,
            hasFrame: stream.getLastFrame() !== null,
            lastError: stream.getLastError(),
          };
        }
        sendJson(res, 200, response);
        return;
      }

      case "/frame": {
        try {
          const resolved = resolveFrameStream(url);
          if ("error" in resolved) {
            sendJson(res, 400, resolved);
            return;
          }
          const { stream } = resolved;
          await ensureCapturing([stream]);
          const frame =
            (await stream.waitForFrame(FRAME_WAIT_TIMEOUT_MS)) ??
            stream.getLastFrame();
          if (!frame) {
            sendJson(res, 503, { error: "No frame available yet" });
            return;
          }
          await sendPng(res, frame, stream.width, stream.height, false);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          sendJson(res, 500, { error: msg });
        }
        return;
      }

      case "/frame-filtered": {
        try {
          const resolved = resolveFrameStream(url);
          if ("error" in resolved) {
            sendJson(res, 400, resolved);
            return;
          }
          const { stream } = resolved;
          await ensureCapturing([stream]);
          const frame =
            (await stream.waitForFrame(FRAME_WAIT_TIMEOUT_MS)) ??
            stream.getLastFrame();
          if (!frame) {
            sendJson(res, 503, { error: "No frame available yet" });
            return;
          }
          await sendPng(res, frame, stream.width, stream.height, true);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          sendJson(res, 500, { error: msg });
        }
        return;
      }

      case "/health": {
        const streamStatuses: Record<string, "ok" | "idle" | "error"> = {};
        let degraded = false;
        for (const stream of deps.streams) {
          const error = stream.getLastError();
          const isCapturing = capturing.get(stream.id) ?? false;
          const value = error ? "error" : isCapturing ? "ok" : "idle";
          if (value === "error") degraded = true;
          streamStatuses[stream.id] = value;
        }
        sendJson(res, 200, {
          status: degraded ? "degraded" : "ok",
          streams: streamStatuses,
        });
        return;
      }

      default: {
        sendJson(res, 404, { error: "Not found" });
      }
    }
  });

  server.on("close", () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  });

  return server;
}
