import { readFile } from 'node:fs/promises';
import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
export class DigitClassifier {
    options;
    session = null;
    metadata = null;
    constructor(options) {
        this.options = options;
    }
    async initialize() {
        const raw = await readFile(this.options.metadataPath, 'utf-8');
        this.metadata = JSON.parse(raw);
        this.session = await ort.InferenceSession.create(this.options.modelPath, {
            executionProviders: ['cpu'],
        });
    }
    async classify(imageInput) {
        if (!this.session || !this.metadata) {
            throw new Error('Classifier not initialized. Call initialize() first.');
        }
        const imageBuffer = typeof imageInput === 'string'
            ? await readFile(imageInput)
            : imageInput;
        // Extract green channel and ensure correct dimensions
        const { data } = await sharp(imageBuffer)
            .extractChannel(1) // Green channel
            .resize(this.metadata.input_width, this.metadata.input_height, {
            fit: 'fill',
            kernel: 'nearest',
        })
            .raw()
            .toBuffer({ resolveWithObject: true });
        // Normalize to match training pipeline
        const { mean, std, input_height, input_width } = this.metadata;
        const tensor = new Float32Array(input_height * input_width);
        for (let i = 0; i < data.length; i++) {
            const pixel = data[i] / 255.0;
            tensor[i] = (pixel - mean) / std;
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
        const logits = Array.from(output.data);
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
        return { digit: maxIdx, confidence: maxProb, probabilities };
    }
    async dispose() {
        if (this.session) {
            await this.session.release();
            this.session = null;
        }
    }
}
