import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { toRectConfigs, type Config } from "../src/config.js";
import { createDigitDetector } from "../src/digit-detector.js";
import { createTemplateClassifier } from "../src/template-classifier.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

const CONFIG_PATH = path.resolve(projectRoot, "config.json");
const FRAME_PATH = path.resolve(
  projectRoot,
  "test/fixtures/player2-playing.png",
);
const SOURCE_DIGITS_DIR = path.resolve(
  projectRoot,
  "digit-classifier/source-digits",
);

describe("TemplateClassifier (player-2)", () => {
  let config: Config;
  let rawFrame: Buffer;
  let frameWidth: number;
  let frameHeight: number;

  before(async () => {
    config = JSON.parse(await readFile(CONFIG_PATH, "utf-8")) as Config;

    const image = sharp(FRAME_PATH);
    const metadata = await image.metadata();
    frameWidth = metadata.width!;
    frameHeight = metadata.height!;
    const { data } = await image.raw().toBuffer({ resolveWithObject: true });
    rawFrame = data;
  });

  it("reads the calibrated player-2 frame using training templates", async () => {
    const streamConfig = config.streams["player-2"];
    const classifier = await createTemplateClassifier({
      sourceDir: SOURCE_DIGITS_DIR,
      inputThreshold: streamConfig.binarizationThreshold ?? 170,
    });
    const detector = createDigitDetector(
      classifier,
      toRectConfigs(streamConfig.geometry.rects),
    );

    const results = await detector.detect(rawFrame, frameWidth, frameHeight);
    const byName = new Map(results.map((result) => [result.name, result.digit]));

    // Frame shows: DISC 83  TRACK 3  0.18
    const expected: Record<string, number | null> = {
      disc_1: null,
      disc_2: 8,
      disc_3: 3,
      track_1: null,
      track_2: 3,
      time_1: null,
      time_2: 0,
      time_3: 1,
      time_4: 8,
    };

    for (const [name, digit] of Object.entries(expected)) {
      assert.equal(
        byName.get(name),
        digit,
        `Rect "${name}": expected ${digit}, got ${byName.get(name)}`,
      );
    }
  });
});
