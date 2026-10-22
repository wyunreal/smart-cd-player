import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { DigitClassifier } from "digit-classifier";

import type { StreamClassifier } from "./classifier.js";
import { loadConfig } from "./config.js";
import { createDigitStream } from "./digit-stream.js";
import { createHttpServer } from "./server.js";
import { createTemplateClassifier } from "./template-classifier.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const config = await loadConfig();

  // Resolve model paths relative to the digit-classifier package
  const modelDir = resolve(__dirname, "../digit-classifier/model");
  const modelPath = resolve(modelDir, "digit_classifier.onnx");
  const metadataPath = resolve(modelDir, "metadata.json");
  const sourceDigitsDir = resolve(
    __dirname,
    "../digit-classifier/source-digits",
  );

  // Initialize the ONNX classifier once and share it between streams that use it
  const onnxClassifier = new DigitClassifier({ modelPath, metadataPath });
  await onnxClassifier.initialize();
  console.log(`ONNX classifier initialized (model: ${modelPath})`);

  const streams = await Promise.all(
    Object.entries(config.streams).map(async ([id, streamConfig]) => {
      const classifier: StreamClassifier =
        streamConfig.classifier === "template"
          ? await createTemplateClassifier({
              sourceDir: sourceDigitsDir,
              inputThreshold: streamConfig.binarizationThreshold ?? 140,
            })
          : onnxClassifier;

      return {
        classifierType: streamConfig.classifier ?? "onnx",
        stream: createDigitStream({
          id,
          stream: streamConfig,
          classifier,
          detection: config.detection,
        }),
      };
    }),
  );

  const server = createHttpServer({
    port: config.server.port,
    streams: streams.map(({ stream }) => stream),
    binarizationThreshold: onnxClassifier.binarizationThreshold,
    captureIdleTimeoutMs: config.server.captureIdleTimeoutMs,
    staleAfterMs: config.server.staleAfterMs,
  });

  server.listen(config.server.port, () => {
    console.log(`HTTP server listening on port ${config.server.port}`);
    console.log("");
    console.log("Streams:");
    for (const { stream, classifierType } of streams) {
      const source = stream.capture.device ?? stream.capture.url;
      console.log(
        `  ${stream.id}: capture=${stream.capture.id} source=${source} ` +
          `(${stream.width}x${stream.height} @ ${stream.capture.fps}fps, ` +
          `classifier=${classifierType})`,
      );
    }
    console.log("");
    console.log("Endpoints:");
    console.log("  GET  /display              - all stream readings");
    console.log("  GET  /streams              - stream/capture diagnostics");
    console.log("  GET  /frame?id=<id>        - latest frame as PNG");
    console.log("  GET  /frame-annotated?id=<id> - raw frame + digit rects");
    console.log(
      `  GET  /frame-filtered?id=<id> - binarized frame (threshold ${onnxClassifier.binarizationThreshold})`,
    );
    console.log("  GET  /health               - health check");
    console.log("  POST /capture/start?id=<id> - start one stream (or all)");
    console.log("  POST /capture/stop?id=<id>  - stop one stream (or all)");
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\nShutting down...");
    await Promise.all(streams.map(({ stream }) => stream.stop()));
    server.close();
    await onnxClassifier.dispose();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
