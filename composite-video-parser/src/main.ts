import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { DigitClassifier } from "digit-classifier";

import { loadConfig } from "./config.js";
import { createDigitStream } from "./digit-stream.js";
import { createHttpServer } from "./server.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const config = await loadConfig();

  // Resolve model paths relative to the digit-classifier package
  const modelDir = resolve(__dirname, "../digit-classifier/model");
  const modelPath = resolve(modelDir, "digit_classifier.onnx");
  const metadataPath = resolve(modelDir, "metadata.json");

  // Initialize the classifier once and share it between all streams
  const classifier = new DigitClassifier({ modelPath, metadataPath });
  await classifier.initialize();
  console.log(`Classifier initialized (model: ${modelPath})`);

  const streams = Object.entries(config.streams).map(([id, streamConfig]) =>
    createDigitStream({
      id,
      stream: streamConfig,
      classifier,
      detection: config.detection,
    }),
  );

  const server = createHttpServer({
    port: config.server.port,
    streams,
    binarizationThreshold: classifier.binarizationThreshold,
    captureIdleTimeoutMs: config.server.captureIdleTimeoutMs,
    staleAfterMs: config.server.staleAfterMs,
  });

  server.listen(config.server.port, () => {
    console.log(`HTTP server listening on port ${config.server.port}`);
    console.log("");
    console.log("Streams:");
    for (const stream of streams) {
      const source = stream.capture.device ?? stream.capture.url;
      console.log(
        `  ${stream.id}: capture=${stream.capture.id} source=${source} ` +
          `(${stream.width}x${stream.height} @ ${stream.capture.fps}fps)`,
      );
    }
    console.log("");
    console.log("Endpoints:");
    console.log("  GET  /display              - all stream readings");
    console.log("  GET  /streams              - stream/capture diagnostics");
    console.log("  GET  /frame?id=<id>        - latest frame as PNG");
    console.log("  GET  /frame-annotated?id=<id> - raw frame + digit rects");
    console.log(
      `  GET  /frame-filtered?id=<id> - binarized frame (threshold ${classifier.binarizationThreshold})`,
    );
    console.log("  GET  /health               - health check");
    console.log("  POST /capture/start?id=<id> - start one stream (or all)");
    console.log("  POST /capture/stop?id=<id>  - stop one stream (or all)");
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\nShutting down...");
    await Promise.all(streams.map((stream) => stream.stop()));
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
