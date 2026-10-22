import type { StreamClassifier } from "./classifier.js";

import type {
  CaptureConfig,
  DetectionConfig,
  PointConfig,
  RectConfig,
  StreamConfig,
} from "./config.js";
import { toFrameProviderConfig, toRectConfigs } from "./config.js";
import {
  createDigitDetector,
  detectWithRetry,
  type DetectionResult,
} from "./digit-detector.js";
import { createFrameProvider } from "./frame-provider-factory.js";
import type { FrameProvider } from "./frame-provider.js";

export type DisplayMode = "off" | "stopped" | "playing" | "paused";

export interface DigitState {
  digits: DetectionResult[];
  mode: DisplayMode;
  timestamp: number;
}

export interface DigitStream {
  readonly id: string;
  readonly capture: CaptureConfig;
  readonly rects: RectConfig[];
  readonly powerPixel: PointConfig;
  readonly modePixel: PointConfig;
  readonly width: number;
  readonly height: number;
  start(): Promise<void>;
  stop(): Promise<void>;
  getState(): DigitState;
  waitForFreshState(): Promise<DigitState>;
  waitForFrame(timeoutMs: number): Promise<Buffer | null>;
  getLastFrame(): Buffer | null;
  getLastFrameAt(): number;
  getLastError(): string | null;
}

export interface CreateDigitStreamOptions {
  id: string;
  stream: StreamConfig;
  classifier: StreamClassifier;
  detection: DetectionConfig;
}

const PAUSE_DETECT_MS = 2000;

export const createDigitStream = ({
  id,
  stream,
  classifier,
  detection,
}: CreateDigitStreamOptions): DigitStream => {
  const { capture, geometry } = stream;
  const frameProvider: FrameProvider = createFrameProvider(
    toFrameProviderConfig(capture),
    { name: id },
  );
  const rects = toRectConfigs(geometry.rects);
  const detector = createDigitDetector(classifier, rects);

  let state: DigitState = { digits: [], mode: "off", timestamp: 0 };
  let detecting = false;
  let lastSeconds: number | null = null;
  let lastSecondsChangeTime = 0;
  let lastFrameAt = 0;
  let lastError: string | null = null;

  const freshStateListeners: Array<(state: DigitState) => void> = [];

  const resolveFreshListeners = (): void => {
    while (freshStateListeners.length > 0) {
      freshStateListeners.shift()!(state);
    }
  };

  const isPoweredOn = (frame: Buffer): boolean => {
    const { x, y } = geometry.powerPixel;
    const offset = (y * capture.width + x) * 3;
    const r = frame[offset];
    const g = frame[offset + 1];
    const b = frame[offset + 2];
    // Green pixel when on, black when off
    return g > 30 && g > r && g > b;
  };

  const isPixelStopped = (frame: Buffer): boolean => {
    const { x, y } = geometry.modePixel;
    const offset = (y * capture.width + x) * 3;
    const minRgb = Math.min(
      frame[offset],
      frame[offset + 1],
      frame[offset + 2],
    );
    return minRgb > classifier.binarizationThreshold;
  };

  const getSeconds = (digits: DetectionResult[]): number | null => {
    const byName = new Map(digits.map((d) => [d.name, d.digit]));
    const t3 = byName.get("time_3");
    const t4 = byName.get("time_4");
    if (t3 == null && t4 == null) return null;
    return (t3 ?? 0) * 10 + (t4 ?? 0);
  };

  const detectMode = (
    digits: DetectionResult[],
  ): "stopped" | "playing" | "paused" => {
    const seconds = getSeconds(digits);
    const now = Date.now();

    if (seconds === null) {
      lastSeconds = null;
      lastSecondsChangeTime = 0;
      return "stopped";
    }

    if (seconds !== lastSeconds) {
      lastSeconds = seconds;
      lastSecondsChangeTime = now;
      return "playing";
    }

    return now - lastSecondsChangeTime >= PAUSE_DETECT_MS
      ? "paused"
      : "playing";
  };

  const randomRetryDelay = (): number =>
    detection.retryDelayMinMs +
    Math.random() * (detection.retryDelayMaxMs - detection.retryDelayMinMs);

  const setState = (next: DigitState): void => {
    state = next;
    resolveFreshListeners();
  };

  const processFrame = async (frame: Buffer): Promise<void> => {
    if (!isPoweredOn(frame)) {
      lastSeconds = null;
      lastSecondsChangeTime = 0;
      lastError = null;
      setState({ digits: [], mode: "off", timestamp: Date.now() });
      return;
    }

    if (isPixelStopped(frame)) {
      lastSeconds = null;
      lastSecondsChangeTime = 0;
      lastError = null;
      setState({ digits: [], mode: "stopped", timestamp: Date.now() });
      return;
    }

    try {
      const digits = await detectWithRetry(
        frame,
        detector,
        () => frameProvider.captureFrame(),
        capture.width,
        capture.height,
        detection.minDigitConfidenceMargin,
        () =>
          new Promise<void>((resolve) =>
            setTimeout(resolve, randomRetryDelay()),
          ),
      );

      const mode = detectMode(digits);
      lastError = null;
      setState({ digits, mode, timestamp: Date.now() });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      resolveFreshListeners();
    }
  };

  frameProvider.on("frame", (frame: Buffer) => {
    lastFrameAt = Date.now();
    if (detecting) return;

    detecting = true;
    processFrame(frame)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[${id}] [detector] error: ${msg}`);
      })
      .finally(() => {
        detecting = false;
      });
  });

  return {
    id,
    capture,
    rects,
    powerPixel: geometry.powerPixel,
    modePixel: geometry.modePixel,
    width: capture.width,
    height: capture.height,
    start: async () => {
      lastError = null;
      await frameProvider.start();
    },
    stop: async () => {
      lastError = null;
      lastFrameAt = 0;
      state = { digits: [], mode: "off", timestamp: 0 };
      await frameProvider.stop();
    },
    getState: () => state,
    waitForFreshState: () =>
      new Promise<DigitState>((resolve) => {
        if (state.timestamp > 0) {
          resolve(state);
          return;
        }
        freshStateListeners.push(resolve);
      }),
    waitForFrame: (timeoutMs: number) =>
      new Promise<Buffer | null>((resolve) => {
        const current = frameProvider.getLatestFrame();
        if (current) {
          resolve(current);
          return;
        }

        const onFrame = (): void => {
          cleanup();
          resolve(frameProvider.getLatestFrame());
        };
        const timer = setTimeout(() => {
          cleanup();
          resolve(frameProvider.getLatestFrame());
        }, timeoutMs);
        const cleanup = (): void => {
          clearTimeout(timer);
          frameProvider.off("frame", onFrame);
        };

        frameProvider.on("frame", onFrame);
      }),
    getLastFrame: () => frameProvider.getLatestFrame(),
    getLastFrameAt: () => lastFrameAt,
    getLastError: () => lastError ?? frameProvider.getLastError(),
  };
};
