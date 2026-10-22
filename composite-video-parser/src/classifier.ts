import type { ClassificationResult } from "digit-classifier";

/**
 * Common interface for the ONNX classifier and the template/k-NN classifier.
 */
export interface StreamClassifier {
  readonly binarizationThreshold: number;
  classify(imageInput: Buffer | string): Promise<ClassificationResult>;
}
