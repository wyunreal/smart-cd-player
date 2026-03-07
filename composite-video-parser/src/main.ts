import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { DigitClassifier } from "half-digit-classifier";

import { createDigitDetector } from "./digit-detector.js";

import { loadConfig } from "./config.js";
import { createFrameProvider } from "./frame-provider-factory.js";
import type { DetectionResult } from "./digit-detector.js";
import { createHttpServer, type DigitState } from "./server.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const config = await loadConfig();

  // Resolve model paths relative to the half-digit-classifier package
  const modelDir = resolve(__dirname, "../half-digit-classifier/model");
  const modelPath = resolve(modelDir, "digit_classifier.onnx");
  const metadataPath = resolve(modelDir, "metadata.json");

  // Initialize classifier
  const classifier = new DigitClassifier({ modelPath, metadataPath });
  await classifier.initialize();
  console.log(`Classifier initialized (model: ${modelPath})`);

  // Create frame provider
  const frameProvider = createFrameProvider(config.frameProvider);

  // Create detector
  const detector = createDigitDetector(classifier, config.rects);

  // Shared state for API responses
  let state: DigitState = { digits: [], mode: "off", timestamp: 0 };
  let detecting = false;

  const PAUSE_DETECT_MS = 2000;

  const isPoweredOn = (frame: Buffer): boolean => {
    const { x, y } = config.powerPixel;
    const offset = (y * config.frameProvider.width + x) * 3;
    const r = frame[offset];
    const g = frame[offset + 1];
    const b = frame[offset + 2];
    // Green pixel when on, black when off
    return g > 30 && g > r && g > b;
  };

  const isPixelStopped = (frame: Buffer): boolean => {
    const { x, y } = config.modePixel;
    const offset = (y * config.frameProvider.width + x) * 3;
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

  let lastSeconds: number | null = null;
  let lastSecondsChangeTime = 0;

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

  // Listeners waiting for a fresh detection result
  const freshStateListeners: Array<(s: DigitState) => void> = [];

  const resolveFreshListeners = () => {
    while (freshStateListeners.length > 0) {
      freshStateListeners.shift()!(state);
    }
  };

  // Detection loop: process frames as they arrive, skip if busy
  frameProvider.on("frame", (frame: Buffer) => {
    if (detecting) return;
    detecting = true;

    if (!isPoweredOn(frame)) {
      lastSeconds = null;
      lastSecondsChangeTime = 0;
      state = { digits: [], mode: "off", timestamp: Date.now() };
      resolveFreshListeners();
      detecting = false;
      return;
    }

    if (isPixelStopped(frame)) {
      lastSeconds = null;
      lastSecondsChangeTime = 0;
      state = { digits: [], mode: "stopped", timestamp: Date.now() };
      resolveFreshListeners();
      detecting = false;
      return;
    }

    detector
      .detect(frame, config.frameProvider.width, config.frameProvider.height)
      .then((digits) => {
        const mode = detectMode(digits);
        state = { digits, mode, timestamp: Date.now() };
        resolveFreshListeners();
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[detector] error: ${msg}`);
      })
      .finally(() => {
        detecting = false;
      });
  });

  const waitForFreshState = (): Promise<DigitState> =>
    new Promise((resolve) => {
      freshStateListeners.push(resolve);
    });

  // Start HTTP server
  const server = createHttpServer({
    port: config.server.port,
    frameProvider,
    getState: () => state,
    waitForFreshState,
    frameWidth: config.frameProvider.width,
    frameHeight: config.frameProvider.height,
    binarizationThreshold: classifier.binarizationThreshold,
    captureIdleTimeoutMs: config.server.captureIdleTimeoutMs,
  });

  server.listen(config.server.port, () => {
    console.log(`HTTP server listening on port ${config.server.port}`);
    console.log(`  GET  /display        - disc, track, minutes, seconds`);
    console.log(`  GET  /frame          - latest frame as PNG`);
    console.log(
      `  GET  /frame-filtered - frame with binarization threshold ${classifier.binarizationThreshold}`,
    );
    console.log(`  GET  /health         - health check`);
    console.log(`  POST /capture/start  - start video capture`);
    console.log(`  POST /capture/stop   - stop video capture`);
  });

  console.log(
    `Frame provider ready (type: ${config.frameProvider.type}, ` +
      `${config.frameProvider.width}x${config.frameProvider.height} @ ${config.frameProvider.fps}fps)`,
  );
  console.log(`Monitoring ${config.rects.length} digit region(s)`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\nShutting down...");
    await frameProvider.stop();
    server.close();
    await classifier.dispose();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
