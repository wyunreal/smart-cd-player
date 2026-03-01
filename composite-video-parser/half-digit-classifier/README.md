# Half-Digit Classifier

Classifies the bottom half of digits (0-9) captured from composite video, or detects the absence of a digit (blank).

Images are 26x21 pixel PNGs with white digits on a green background.

## Project Structure

```
half-digit-classifier/
  source-digits/          # Training images organized by class
    0/ ... 9/             # Digit classes
    blank/                # No digit (green background)
  train/                  # Python training code
    setup.sh              # Creates venv and installs dependencies
    requirements.txt
    model.py              # CNN architecture (~7,600 params)
    dataset.py            # Data loading, green channel extraction, augmentation
    train.py              # Training, evaluation, ONNX export
    export_onnx.py        # Standalone ONNX export
  model/                  # Generated artifacts
    digit_classifier.onnx # Trained ONNX model
    metadata.json         # Preprocessing params (mean, std, dimensions)
  inference/              # Node.js inference package
    src/classifier.ts     # DigitClassifier class
    src/index.ts          # Public exports
    test/classifier.test.ts
```

## Training

### Prerequisites

- Python 3.10+

### Setup (first time only)

```bash
cd train
./setup.sh
```

### Train the model

```bash
cd inference
npm run train
```

Or manually:

```bash
cd train
source .venv/bin/activate
python3 train.py
```

This will:

1. Discover all classes from `source-digits/` subfolders (0-9, blank, etc.)
2. Split 80% train / 20% validation (stratified)
3. Train a small CNN (max 100 epochs, early stopping on validation accuracy)
4. Print a classification report and confusion matrix
5. Export the model to `model/digit_classifier.onnx`
6. Write preprocessing params to `model/metadata.json`

### Adding more training data

Place new 26x21 PNG images in the corresponding `source-digits/<class>/` folder and re-train. Classes are discovered dynamically from subfolder names.

### Re-exporting an existing checkpoint

If you have a saved `.pt` checkpoint and want to export it to ONNX without re-training:

```bash
cd train
source .venv/bin/activate
python3 export_onnx.py <checkpoint.pt> ../model/digit_classifier.onnx
```

## Using the model in Node.js

### Prerequisites

- Node.js 18+

### Setup

```bash
cd inference
npm install
npm run build
```

### Usage

```typescript
import { DigitClassifier } from 'half-digit-classifier';

const classifier = new DigitClassifier({
  modelPath: './model/digit_classifier.onnx',
  metadataPath: './model/metadata.json',
});

await classifier.initialize();

// Classify from a file path
const result = await classifier.classify('./some-image.png');
console.log(result);
// { digit: 5, confidence: 0.94, probabilities: [0.01, 0.00, ...] }

// Blank image (no digit)
const blank = await classifier.classify('./blank-image.png');
console.log(blank);
// { digit: null, confidence: 0.87, probabilities: [...] }

// Or from a Buffer
const buffer = fs.readFileSync('./some-image.png');
const result2 = await classifier.classify(buffer);

// Release resources when done
await classifier.dispose();
```

### API

#### `new DigitClassifier(options)`

| Option         | Type   | Description                    |
|----------------|--------|--------------------------------|
| `modelPath`    | string | Path to `digit_classifier.onnx` |
| `metadataPath` | string | Path to `metadata.json`         |

#### `classifier.initialize(): Promise<void>`

Loads the ONNX model and metadata. Must be called before `classify()`.

#### `classifier.classify(input): Promise<ClassificationResult>`

| Parameter | Type               | Description                  |
|-----------|--------------------|------------------------------|
| `input`   | `string \| Buffer` | PNG file path or image buffer |

Returns:

| Field           | Type           | Description                                    |
|-----------------|----------------|------------------------------------------------|
| `digit`         | number \| null | Predicted digit (0-9), or `null` if no digit   |
| `confidence`    | number         | Probability of the predicted class (0.0 - 1.0) |
| `probabilities` | number[]       | Probability for each class                     |

#### `classifier.dispose(): Promise<void>`

Releases the ONNX runtime session.

### npm scripts

| Script          | Description                                  |
|-----------------|----------------------------------------------|
| `npm run build` | Compile TypeScript                           |
| `npm test`      | Run classification tests                     |
| `npm run verify`| Build + run tests                            |
| `npm run train:setup` | Set up Python venv (first time only)   |
| `npm run train` | Train the model and export to ONNX           |

### Run tests

```bash
cd inference
npm run verify
```

Tests classify one sample image from each class folder and verify the prediction is correct.
