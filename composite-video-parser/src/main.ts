import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DigitClassifier } from 'half-digit-classifier';

import { DigitDetector } from './digit-detector.js';

import { loadConfig } from './config.js';
import { createFrameProvider } from './frame-provider.js';
import { createHttpServer, type DigitState } from './server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const config = await loadConfig();

  // Resolve model paths relative to the half-digit-classifier package
  const modelDir = resolve(__dirname, '../half-digit-classifier/model');
  const modelPath = resolve(modelDir, 'digit_classifier.onnx');
  const metadataPath = resolve(modelDir, 'metadata.json');

  // Initialize classifier
  const classifier = new DigitClassifier({ modelPath, metadataPath });
  await classifier.initialize();
  console.log(`Classifier initialized (model: ${modelPath})`);

  // Create frame provider
  const frameProvider = createFrameProvider(config.frameProvider);

  // Create detector
  const detector = new DigitDetector(classifier, config.rects);

  // Shared state for API responses
  let state: DigitState = { digits: [], timestamp: 0 };
  let detecting = false;

  // Detection loop: process frames as they arrive, skip if busy
  frameProvider.on('frame', (frame: Buffer) => {
    if (detecting) return;
    detecting = true;

    detector
      .detect(frame, config.frameProvider.width, config.frameProvider.height)
      .then((digits) => {
        state = { digits, timestamp: Date.now() };
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[detector] error: ${msg}`);
      })
      .finally(() => {
        detecting = false;
      });
  });

  // Start HTTP server
  const server = createHttpServer({
    port: config.server.port,
    frameProvider,
    getState: () => state,
    frameWidth: config.frameProvider.width,
    frameHeight: config.frameProvider.height,
    binarizationThreshold: classifier.binarizationThreshold,
  });

  server.listen(config.server.port, () => {
    console.log(`HTTP server listening on port ${config.server.port}`);
    console.log(`  GET /display - disc, track, minutes, seconds`);
    console.log(`  GET /frame  - latest frame as PNG`);
    console.log(`  GET /frame-filtered - frame with binarization threshold ${classifier.binarizationThreshold}`);
    console.log(`  GET /health - health check`);
  });

  // Start capturing frames
  await frameProvider.start();
  console.log(
    `Frame provider started (type: ${config.frameProvider.type}, ` +
      `${config.frameProvider.width}x${config.frameProvider.height} @ ${config.frameProvider.fps}fps)`,
  );
  console.log(`Monitoring ${config.rects.length} digit region(s)`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down...');
    await frameProvider.stop();
    server.close();
    await classifier.dispose();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
