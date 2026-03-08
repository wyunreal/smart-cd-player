import { readFile } from 'node:fs/promises';

import * as ort from 'onnxruntime-node';
import sharp from 'sharp';

export interface ClassificationResult {
  digit: number | null;
  confidence: number;
  probabilities: number[];
}

export interface ClassifierOptions {
  modelPath: string;
  metadataPath: string;
}

interface Metadata {
  input_width: number;
  input_height: number;
  mean: number;
  std: number;
  class_labels: string[];
  binarization_threshold: number;
}

/**
 * Morphological opening (erode then dilate) with a 3x3 cross kernel.
 * Removes isolated noise pixels while preserving segment shapes.
 */
function morphologicalOpening(
  src: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const eroded = new Uint8Array(width * height);
  const dilated = new Uint8Array(width * height);

  // Erode: pixel is 1 only if itself and all 4-connected neighbours are 1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (
        src[i] === 1 &&
        (y === 0 || src[(y - 1) * width + x] === 1) &&
        (y === height - 1 || src[(y + 1) * width + x] === 1) &&
        (x === 0 || src[y * width + (x - 1)] === 1) &&
        (x === width - 1 || src[y * width + (x + 1)] === 1)
      ) {
        eroded[i] = 1;
      }
    }
  }

  // Dilate: pixel is 1 if itself or any 4-connected neighbour is 1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (
        eroded[i] === 1 ||
        (y > 0 && eroded[(y - 1) * width + x] === 1) ||
        (y < height - 1 && eroded[(y + 1) * width + x] === 1) ||
        (x > 0 && eroded[y * width + (x - 1)] === 1) ||
        (x < width - 1 && eroded[y * width + (x + 1)] === 1)
      ) {
        dilated[i] = 1;
      }
    }
  }

  return dilated;
}

export class DigitClassifier {
  private session: ort.InferenceSession | null = null;
  private metadata: Metadata | null = null;

  constructor(private readonly options: ClassifierOptions) {}

  async initialize(): Promise<void> {
    const raw = await readFile(this.options.metadataPath, 'utf-8');
    this.metadata = JSON.parse(raw) as Metadata;

    this.session = await ort.InferenceSession.create(this.options.modelPath, {
      executionProviders: ['cpu'],
    });
  }

  get binarizationThreshold(): number {
    if (!this.metadata) {
      throw new Error('Classifier not initialized. Call initialize() first.');
    }
    return this.metadata.binarization_threshold;
  }

  async classify(imageInput: Buffer | string): Promise<ClassificationResult> {
    if (!this.session || !this.metadata) {
      throw new Error('Classifier not initialized. Call initialize() first.');
    }

    const imageBuffer =
      typeof imageInput === 'string'
        ? await readFile(imageInput)
        : imageInput;

    // Resize and get raw RGB pixels
    const { data: rgb } = await sharp(imageBuffer)
      .removeAlpha()
      .resize(this.metadata.input_width, this.metadata.input_height, {
        fit: 'fill',
        kernel: 'nearest',
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // min(R,G,B) threshold: white pixels have all channels high, green bg has low R
    const { mean, std, input_height, input_width } = this.metadata;
    const binary = new Uint8Array(input_height * input_width);
    for (let i = 0; i < binary.length; i++) {
      const ri = i * 3;
      const r = rgb[ri], g = rgb[ri + 1], b = rgb[ri + 2];
      const minRgb = Math.min(r, g, b);
      binary[i] = minRgb > this.metadata.binarization_threshold ? 1 : 0;
    }

    // Morphological opening (erosion then dilation) to remove isolated noise pixels
    const opened = morphologicalOpening(binary, input_width, input_height);

    const tensor = new Float32Array(input_height * input_width);
    for (let i = 0; i < tensor.length; i++) {
      tensor[i] = (opened[i] - mean) / std;
    }

    // Run inference: input shape [1, 1, height, width]
    const inputTensor = new ort.Tensor('float32', tensor, [
      1,
      1,
      input_height,
      input_width,
    ]);

    const results = await this.session.run({ input: inputTensor });
    const output = results['output'];
    if (!output) {
      throw new Error('Model output "output" not found');
    }
    const logits = Array.from(output.data as Float32Array);

    // Softmax
    const maxLogit = Math.max(...logits);
    const exps = logits.map((l) => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probabilities = exps.map((e) => e / sumExps);

    // Argmax
    let maxProb = 0;
    let maxIdx = 0;
    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIdx = i;
      }
    }

    // Map class index to digit or null (for non-numeric classes like "blank")
    const label = this.metadata.class_labels[maxIdx];
    const digit = /^\d$/.test(label) ? parseInt(label, 10) : null;

    return { digit, confidence: maxProb, probabilities };
  }

  async dispose(): Promise<void> {
    if (this.session) {
      await this.session.release();
      this.session = null;
    }
  }
}
