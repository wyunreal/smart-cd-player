import sharp from "sharp";
import { DigitClassifier } from "half-digit-classifier";

import type { RectConfig } from "./config.js";

export interface DetectionResult {
  name: string;
  digit: number | null;
  confidence: number;
}

export interface DigitDetector {
  detect(
    frame: Buffer,
    width: number,
    height: number,
  ): Promise<DetectionResult[]>;
}

export const createDigitDetector = (
  classifier: DigitClassifier,
  rects: RectConfig[],
): DigitDetector => ({
  detect: async (frame, width, height) => {
    const results: DetectionResult[] = [];

    for (const rect of rects) {
      const cropped = await sharp(frame, {
        raw: { width, height, channels: 3 },
      })
        .extract({
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
        })
        .png()
        .toBuffer();

      const classification = await classifier.classify(cropped);

      results.push({
        name: rect.name,
        digit: classification.digit,
        confidence: classification.confidence,
      });
    }

    return results;
  },
});
