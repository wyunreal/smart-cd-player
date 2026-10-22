import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import type { ClassificationResult } from "digit-classifier";
import sharp from "sharp";

import type { StreamClassifier } from "./classifier.js";

const TEMPLATE_WIDTH = 26;
const TEMPLATE_HEIGHT = 21;
const DEFAULT_TEMPLATE_THRESHOLD = 140;
const DEFAULT_INPUT_THRESHOLD = 140;
const K = 7;

export interface TemplateClassifierOptions {
  sourceDir: string;
  /**
   * Threshold used to binarize the incoming crop. The training templates are
   * binarized with DEFAULT_TEMPLATE_THRESHOLD.
   */
  inputThreshold?: number;
  templateThreshold?: number;
}

interface Template {
  label: string;
  bits: Uint8Array;
}

const toBits = async (
  input: Buffer | string,
  threshold: number,
): Promise<Uint8Array> => {
  const buffer = typeof input === "string" ? await readFile(input) : input;
  const { data } = await sharp(buffer)
    .removeAlpha()
    .resize(TEMPLATE_WIDTH, TEMPLATE_HEIGHT, {
      fit: "fill",
      kernel: "nearest",
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bits = new Uint8Array(TEMPLATE_WIDTH * TEMPLATE_HEIGHT);
  for (let i = 0; i < bits.length; i++) {
    const ri = i * 3;
    const minRgb = Math.min(data[ri], data[ri + 1], data[ri + 2]);
    bits[i] = minRgb > threshold ? 1 : 0;
  }
  return bits;
};

const loadTemplates = async (
  sourceDir: string,
  threshold: number,
): Promise<Template[]> => {
  const templates: Template[] = [];
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const labelDir = join(sourceDir, entry.name);
    const files = (await readdir(labelDir)).filter((file) =>
      file.endsWith(".png"),
    );

    for (const file of files) {
      templates.push({
        label: entry.name,
        bits: await toBits(join(labelDir, file), threshold),
      });
    }
  }

  if (templates.length === 0) {
    throw new Error(`No template images found in ${sourceDir}`);
  }

  return templates;
};

/**
 * k-NN classifier over the training digit images. Useful for streams whose OSD
 * font differs from the one the ONNX model was trained on.
 */
export const createTemplateClassifier = async (
  options: TemplateClassifierOptions,
): Promise<StreamClassifier> => {
  const inputThreshold = options.inputThreshold ?? DEFAULT_INPUT_THRESHOLD;
  const templateThreshold =
    options.templateThreshold ?? DEFAULT_TEMPLATE_THRESHOLD;
  const templates = await loadTemplates(
    options.sourceDir,
    templateThreshold,
  );

  return {
    binarizationThreshold: inputThreshold,
    classify: async (
      imageInput: Buffer | string,
    ): Promise<ClassificationResult> => {
      const bits = await toBits(imageInput, inputThreshold);

      const distances = templates.map((template) => {
        let mismatches = 0;
        for (let i = 0; i < bits.length; i++) {
          if (bits[i] !== template.bits[i]) mismatches++;
        }
        return { label: template.label, distance: mismatches / bits.length };
      });
      distances.sort((a, b) => a.distance - b.distance);

      const votes = new Map<string, number>();
      const k = Math.min(K, distances.length);
      for (let i = 0; i < k; i++) {
        const label = distances[i].label;
        votes.set(label, (votes.get(label) ?? 0) + 1);
      }

      const sortedVotes = [...votes.entries()].sort((a, b) => b[1] - a[1]);
      const [bestLabel, bestVotes] = sortedVotes[0];
      const secondVotes = sortedVotes[1]?.[1] ?? 0;

      return {
        digit: /^\d$/.test(bestLabel) ? parseInt(bestLabel, 10) : null,
        confidence: (bestVotes - secondVotes) / k,
        probabilities: sortedVotes.map(([, count]) => count / k),
      };
    },
  };
};
