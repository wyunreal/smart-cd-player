import assert from 'node:assert/strict';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';
import { DigitClassifier } from 'half-digit-classifier';

import { DigitDetector } from '../src/digit-detector.js';
import type { RectConfig } from '../src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// From dist/test/ go up two levels to reach the project root
const projectRoot = path.resolve(__dirname, '../..');

const FRAME_PATH = path.resolve(projectRoot, 'test/fixtures/frame-all-digits.png');

// Frame shows: DISC 129  TRACK 12  1.05
const RECTS: RectConfig[] = [
  { name: 'disc_1', x: 117, y: 0, width: 26, height: 21 },
  { name: 'disc_2', x: 144, y: 0, width: 26, height: 21 },
  { name: 'disc_3', x: 171, y: 0, width: 26, height: 21 },
  { name: 'track_1', x: 373, y: 0, width: 26, height: 21 },
  { name: 'track_2', x: 400, y: 0, width: 26, height: 21 },
  { name: 'time_1', x: 513, y: 0, width: 26, height: 21 },
  { name: 'time_2', x: 571, y: 0, width: 26, height: 21 },
  { name: 'time_3', x: 598, y: 0, width: 26, height: 21 },
];

const EXPECTED_DIGITS: (number | null)[] = [1, 2, 9, 1, 2, 1, 0, 5];

describe('DigitDetector (end-to-end)', () => {
  let classifier: DigitClassifier;
  let detector: DigitDetector;
  let rawFrame: Buffer;
  let frameWidth: number;
  let frameHeight: number;

  before(async () => {
    // Load classifier
    classifier = new DigitClassifier({
      modelPath: path.resolve(
        projectRoot,
        'half-digit-classifier/model/digit_classifier.onnx',
      ),
      metadataPath: path.resolve(
        projectRoot,
        'half-digit-classifier/model/metadata.json',
      ),
    });
    await classifier.initialize();

    // Load test frame and convert to raw RGB
    const image = sharp(FRAME_PATH);
    const metadata = await image.metadata();
    frameWidth = metadata.width!;
    frameHeight = metadata.height!;

    const { data } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });
    rawFrame = data;

    detector = new DigitDetector(classifier, RECTS);
  });

  after(async () => {
    await classifier.dispose();
  });

  it('should detect the expected digits from the frame', async () => {
    const results = await detector.detect(rawFrame, frameWidth, frameHeight);

    assert.equal(results.length, RECTS.length);

    for (let i = 0; i < results.length; i++) {
      assert.equal(
        results[i].digit,
        EXPECTED_DIGITS[i],
        `Rect "${RECTS[i].name}": expected digit ${EXPECTED_DIGITS[i]}, got ${results[i].digit}`,
      );
      assert.ok(
        results[i].confidence > 0.5,
        `Rect "${RECTS[i].name}": confidence ${results[i].confidence} too low`,
      );
    }
  });

  it('should return a result for each configured rect', async () => {
    const results = await detector.detect(rawFrame, frameWidth, frameHeight);

    const names = results.map((r) => r.name);
    for (const rect of RECTS) {
      assert.ok(names.includes(rect.name), `Missing result for rect "${rect.name}"`);
    }
  });
});
