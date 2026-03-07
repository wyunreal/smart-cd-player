import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import { DigitClassifier } from "half-digit-classifier";

import {
  createDigitDetector,
  type DigitDetector,
} from "../src/digit-detector.js";
import {
  createHttpServer,
  toDisplayState,
  type DigitState,
} from "../src/server.js";
import type { Config } from "../src/config.js";
import type { FrameProvider } from "../src/frame-provider.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// From dist/test/ go up two levels to reach the project root
const projectRoot = path.resolve(__dirname, "../..");

const FRAME_PATH = path.resolve(
  projectRoot,
  "test/fixtures/frame-all-digits.png",
);
const CONFIG_PATH = path.resolve(projectRoot, "config.json");

// Frame shows: DISC 129  TRACK 12  _1.05  (_ = blank tens of minutes)
const EXPECTED_DIGITS: (number | null)[] = [1, 2, 9, 1, 2, null, 1, 0, 5];

describe("DigitDetector (end-to-end)", () => {
  let config: Config;
  let classifier: DigitClassifier;
  let detector: DigitDetector;
  let rawFrame: Buffer;
  let frameWidth: number;
  let frameHeight: number;

  before(async () => {
    // Load config
    config = JSON.parse(await readFile(CONFIG_PATH, "utf-8")) as Config;

    // Load classifier
    classifier = new DigitClassifier({
      modelPath: path.resolve(
        projectRoot,
        "half-digit-classifier/model/digit_classifier.onnx",
      ),
      metadataPath: path.resolve(
        projectRoot,
        "half-digit-classifier/model/metadata.json",
      ),
    });
    await classifier.initialize();

    // Load test frame and convert to raw RGB
    const image = sharp(FRAME_PATH);
    const metadata = await image.metadata();
    frameWidth = metadata.width!;
    frameHeight = metadata.height!;

    const { data } = await image.raw().toBuffer({ resolveWithObject: true });
    rawFrame = data;

    detector = createDigitDetector(classifier, config.rects);
  });

  after(async () => {
    await classifier.dispose();
  });

  it("should detect the expected digits from the frame", async () => {
    const results = await detector.detect(rawFrame, frameWidth, frameHeight);

    assert.equal(results.length, config.rects.length);

    for (let i = 0; i < results.length; i++) {
      assert.equal(
        results[i].digit,
        EXPECTED_DIGITS[i],
        `Rect "${config.rects[i].name}": expected digit ${EXPECTED_DIGITS[i]}, got ${results[i].digit}`,
      );
      assert.ok(
        results[i].confidence > 0.5,
        `Rect "${config.rects[i].name}": confidence ${results[i].confidence} too low`,
      );
    }
  });

  it("should return a result for each configured rect", async () => {
    const results = await detector.detect(rawFrame, frameWidth, frameHeight);

    const names = results.map((r) => r.name);
    for (const rect of config.rects) {
      assert.ok(
        names.includes(rect.name),
        `Missing result for rect "${rect.name}"`,
      );
    }
  });

  it("GET /display should return disc, track, minutes, seconds", async () => {
    const results = await detector.detect(rawFrame, frameWidth, frameHeight);
    const state: DigitState = {
      digits: results,
      mode: "playing",
      timestamp: Date.now(),
    };

    const mockFrameProvider = {
      start: async () => {},
      stop: async () => {},
      on: () => {},
      off: () => {},
      getLatestFrame: () => null,
    } as unknown as FrameProvider;

    const server = createHttpServer({
      port: 0,
      frameProvider: mockFrameProvider,
      getState: () => state,
      waitForFreshState: () => Promise.resolve(state),
      frameWidth,
      frameHeight,
      binarizationThreshold: classifier.binarizationThreshold,
      captureIdleTimeoutMs: 1,
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address() as { port: number };

    try {
      const res = await fetch(`http://localhost:${addr.port}/display`);
      assert.equal(res.status, 200);

      const body = await res.json();
      assert.equal(body.mode, "playing");
      assert.equal(body.disc, 129);
      assert.equal(body.track, 12);
      assert.equal(body.minutes, 1);
      assert.equal(body.seconds, 5);
      assert.equal(typeof body.timestamp, "number");
    } finally {
      server.close();
    }
  });
});
