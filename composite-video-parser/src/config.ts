import { readFile } from "node:fs/promises";

export interface PointConfig {
  x: number;
  y: number;
}

export interface RectConfig {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RectGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Internal capture configuration. `id` and `device`/`url` are never used as
 * public stream identifiers; the stream id is the key in Config.streams.
 */
export interface CaptureConfig {
  id: string;
  device?: string;
  url?: string;
  inputFormat?: string;
  videoFilter?: string;
  width: number;
  height: number;
  fps: number;
  brightness?: number;
  contrast?: number;
}

export interface StreamGeometry {
  powerPixel: PointConfig;
  modePixel: PointConfig;
  rects: Record<string, RectGeometry>;
}

export interface StreamConfig {
  capture: CaptureConfig;
  geometry: StreamGeometry;
  classifier?: "onnx" | "template";
  binarizationThreshold?: number;
}

export interface ServerConfig {
  port: number;
  captureIdleTimeoutMs?: number;
  staleAfterMs?: number;
}

export interface DetectionConfig {
  minDigitConfidenceMargin: number;
  retryDelayMinMs: number;
  retryDelayMaxMs: number;
}

export interface Config {
  streams: Record<string, StreamConfig>;
  server: ServerConfig;
  detection: DetectionConfig;
}

export interface DeviceProviderConfig {
  type: "device";
  device: string;
  inputFormat?: string;
  videoFilter?: string;
  width: number;
  height: number;
  fps: number;
  brightness?: number;
  contrast?: number;
}

export interface HttpProviderConfig {
  type: "http";
  url: string;
  width: number;
  height: number;
  fps: number;
}

export type FrameProviderConfig = DeviceProviderConfig | HttpProviderConfig;

export const REQUIRED_RECT_NAMES = [
  "disc_1",
  "disc_2",
  "disc_3",
  "track_1",
  "track_2",
  "time_1",
  "time_2",
  "time_3",
  "time_4",
] as const;

const STREAM_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const RESERVED_STREAM_IDS = new Set(["__proto__", "constructor", "prototype"]);

export const toFrameProviderConfig = (
  capture: CaptureConfig,
): FrameProviderConfig => {
  if (capture.device) {
    return {
      type: "device",
      device: capture.device,
      inputFormat: capture.inputFormat,
      videoFilter: capture.videoFilter,
      width: capture.width,
      height: capture.height,
      fps: capture.fps,
      brightness: capture.brightness,
      contrast: capture.contrast,
    };
  }

  return {
    type: "http",
    url: capture.url!,
    width: capture.width,
    height: capture.height,
    fps: capture.fps,
  };
};

export const toRectConfigs = (
  rects: Record<string, RectGeometry>,
): RectConfig[] =>
  Object.entries(rects).map(([name, rect]) => ({
    name,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  }));

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const assertInBounds = (
  streamId: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  frameWidth: number,
  frameHeight: number,
): void => {
  if (x < 0 || y < 0 || width <= 0 || height <= 0) {
    throw new Error(
      `[${streamId}] ${label} must have x/y >= 0 and width/height > 0`,
    );
  }
  if (x + width > frameWidth || y + height > frameHeight) {
    throw new Error(
      `[${streamId}] ${label} (${x},${y} ${width}x${height}) is outside the ` +
        `${frameWidth}x${frameHeight} frame`,
    );
  }
};

export const validateConfig = (config: Config): void => {
  if (!config || typeof config !== "object") {
    throw new Error("Config must be an object");
  }
  if (
    !config.streams ||
    typeof config.streams !== "object" ||
    Array.isArray(config.streams)
  ) {
    throw new Error("Config.streams must be an object keyed by player id");
  }

  const streamIds = Object.keys(config.streams);
  if (streamIds.length === 0) {
    throw new Error("Config.streams must contain at least one stream");
  }

  if (!config.server || !isFiniteNumber(config.server.port)) {
    throw new Error("Config.server.port must be a number");
  }
  if (
    config.server.staleAfterMs !== undefined &&
    (!isFiniteNumber(config.server.staleAfterMs) ||
      config.server.staleAfterMs <= 0)
  ) {
    throw new Error("Config.server.staleAfterMs must be a positive number");
  }
  if (
    config.server.captureIdleTimeoutMs !== undefined &&
    (!isFiniteNumber(config.server.captureIdleTimeoutMs) ||
      config.server.captureIdleTimeoutMs <= 0)
  ) {
    throw new Error(
      "Config.server.captureIdleTimeoutMs must be a positive number",
    );
  }

  if (
    !config.detection ||
    !isFiniteNumber(config.detection.minDigitConfidenceMargin) ||
    !isFiniteNumber(config.detection.retryDelayMinMs) ||
    !isFiniteNumber(config.detection.retryDelayMaxMs)
  ) {
    throw new Error("Config.detection is missing numeric fields");
  }

  const captureIds = new Set<string>();
  const devices = new Set<string>();

  for (const streamId of streamIds) {
    if (
      !STREAM_ID_PATTERN.test(streamId) ||
      RESERVED_STREAM_IDS.has(streamId)
    ) {
      throw new Error(
        `Invalid stream id "${streamId}". Use lowercase letters, numbers, "-" or "_", ` +
          `starting with a letter or number`,
      );
    }

    const stream = config.streams[streamId];
    if (!stream || typeof stream !== "object") {
      throw new Error(`[${streamId}] stream config must be an object`);
    }

    const { capture, geometry } = stream;
    if (!capture || typeof capture !== "object") {
      throw new Error(`[${streamId}] capture config is missing`);
    }
    if (!capture.id || typeof capture.id !== "string") {
      throw new Error(`[${streamId}] capture.id must be a non-empty string`);
    }
    if (captureIds.has(capture.id)) {
      throw new Error(`Duplicate capture.id "${capture.id}"`);
    }
    captureIds.add(capture.id);

    const hasDevice = !!capture.device;
    const hasUrl = !!capture.url;
    if (hasDevice === hasUrl) {
      throw new Error(
        `[${streamId}] capture must define exactly one of "device" or "url"`,
      );
    }
    if (hasDevice) {
      if (typeof capture.device !== "string" || !capture.device) {
        throw new Error(`[${streamId}] capture.device must be a string`);
      }
      if (
        capture.inputFormat !== undefined &&
        (typeof capture.inputFormat !== "string" || !capture.inputFormat)
      ) {
        throw new Error(
          `[${streamId}] capture.inputFormat must be a non-empty string`,
        );
      }
      if (
        capture.videoFilter !== undefined &&
        (typeof capture.videoFilter !== "string" || !capture.videoFilter)
      ) {
        throw new Error(
          `[${streamId}] capture.videoFilter must be a non-empty string`,
        );
      }
      if (devices.has(capture.device)) {
        throw new Error(
          `[${streamId}] capture.device "${capture.device}" is already used by another stream`,
        );
      }
      devices.add(capture.device);
    }
    if (hasUrl && (typeof capture.url !== "string" || !capture.url)) {
      throw new Error(`[${streamId}] capture.url must be a string`);
    }

    if (
      !isFiniteNumber(capture.width) ||
      !isFiniteNumber(capture.height) ||
      !isFiniteNumber(capture.fps) ||
      capture.width <= 0 ||
      capture.height <= 0 ||
      capture.fps <= 0
    ) {
      throw new Error(
        `[${streamId}] capture.width, height and fps must be positive numbers`,
      );
    }
    if (
      capture.brightness !== undefined &&
      !isFiniteNumber(capture.brightness)
    ) {
      throw new Error(`[${streamId}] capture.brightness must be a number`);
    }
    if (capture.contrast !== undefined && !isFiniteNumber(capture.contrast)) {
      throw new Error(`[${streamId}] capture.contrast must be a number`);
    }

    if (
      stream.classifier !== undefined &&
      stream.classifier !== "onnx" &&
      stream.classifier !== "template"
    ) {
      throw new Error(
        `[${streamId}] classifier must be "onnx" or "template"`,
      );
    }
    if (
      stream.binarizationThreshold !== undefined &&
      (!isFiniteNumber(stream.binarizationThreshold) ||
        stream.binarizationThreshold <= 0 ||
        stream.binarizationThreshold > 255)
    ) {
      throw new Error(
        `[${streamId}] binarizationThreshold must be between 1 and 255`,
      );
    }

    if (!geometry || typeof geometry !== "object") {
      throw new Error(`[${streamId}] geometry config is missing`);
    }

    for (const [name, point] of [
      ["powerPixel", geometry.powerPixel],
      ["modePixel", geometry.modePixel],
    ] as const) {
      if (!point || !isFiniteNumber(point.x) || !isFiniteNumber(point.y)) {
        throw new Error(`[${streamId}] geometry.${name} must have x and y`);
      }
      assertInBounds(
        streamId,
        `geometry.${name}`,
        point.x,
        point.y,
        1,
        1,
        capture.width,
        capture.height,
      );
    }

    if (
      !geometry.rects ||
      typeof geometry.rects !== "object" ||
      Array.isArray(geometry.rects)
    ) {
      throw new Error(`[${streamId}] geometry.rects must be an object`);
    }

    const rectNames = Object.keys(geometry.rects);
    for (const required of REQUIRED_RECT_NAMES) {
      if (!rectNames.includes(required)) {
        throw new Error(
          `[${streamId}] geometry.rects is missing "${required}"`,
        );
      }
    }

    for (const [name, rect] of Object.entries(geometry.rects)) {
      if (
        !rect ||
        !isFiniteNumber(rect.x) ||
        !isFiniteNumber(rect.y) ||
        !isFiniteNumber(rect.width) ||
        !isFiniteNumber(rect.height)
      ) {
        throw new Error(
          `[${streamId}] geometry.rects.${name} must have x, y, width and height`,
        );
      }
      assertInBounds(
        streamId,
        `geometry.rects.${name}`,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        capture.width,
        capture.height,
      );
    }
  }
};

export async function loadConfig(): Promise<Config> {
  const configPath = process.env["CONFIG_PATH"] ?? "config.json";
  const raw = await readFile(configPath, "utf-8");
  const config = JSON.parse(raw) as Config;
  validateConfig(config);
  return config;
}
