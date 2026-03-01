export interface ClassificationResult {
    digit: number;
    confidence: number;
    probabilities: number[];
}
export interface ClassifierOptions {
    modelPath: string;
    metadataPath: string;
}
export declare class DigitClassifier {
    private readonly options;
    private session;
    private metadata;
    constructor(options: ClassifierOptions);
    initialize(): Promise<void>;
    classify(imageInput: Buffer | string): Promise<ClassificationResult>;
    dispose(): Promise<void>;
}
