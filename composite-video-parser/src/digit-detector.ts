import sharp from 'sharp';
import { DigitClassifier } from 'half-digit-classifier';

import type { RectConfig } from './config.js';

export interface DetectionResult {
  name: string;
  digit: number | null;
  confidence: number;
}

export class DigitDetector {
  constructor(
    private readonly classifier: DigitClassifier,
    private readonly rects: RectConfig[],
  ) {}

  async detect(
    frame: Buffer,
    width: number,
    height: number,
  ): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];

    for (const rect of this.rects) {
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

      const classification = await this.classifier.classify(cropped);

      results.push({
        name: rect.name,
        digit: classification.digit,
        confidence: classification.confidence,
      });
    }

    return results;
  }
}
