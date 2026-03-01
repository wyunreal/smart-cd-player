import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { DigitClassifier } from '../src/classifier.js';
// Resolve project root (half-digit-classifier/) from compiled location (dist/test/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');
describe('DigitClassifier', () => {
    let classifier;
    before(async () => {
        classifier = new DigitClassifier({
            modelPath: path.resolve(projectRoot, 'model/digit_classifier.onnx'),
            metadataPath: path.resolve(projectRoot, 'model/metadata.json'),
        });
        await classifier.initialize();
    });
    after(async () => {
        await classifier.dispose();
    });
    for (let digit = 0; digit <= 9; digit++) {
        it(`should classify digit ${digit} correctly`, async () => {
            const digitDir = path.resolve(projectRoot, 'source-digits', String(digit));
            const files = fs
                .readdirSync(digitDir)
                .filter((f) => f.endsWith('.png'))
                .sort();
            const imagePath = path.join(digitDir, files[0]);
            const result = await classifier.classify(imagePath);
            assert.equal(result.digit, digit, `Expected digit ${digit}, got ${result.digit}`);
            assert.ok(result.confidence > 0.15, `Confidence ${result.confidence} too low for digit ${digit}`);
        });
    }
});
