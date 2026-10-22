# Digit Classifier

Classifies digits (0-9) captured from composite video, or detects the absence of a digit (blank).

Images are 26x21 pixel PNGs with white digits on a green background.

## Project Structure

```
digit-classifier/
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
    config_geometry.py    # Per-stream geometry loading from config.json
    frame_url.py          # Frame URL / stream resolution (--url, $FRAME_URL)
    annotate_rects.py     # Draw a stream's rects on a frame (calibration)
    check_live.py         # Classify one live frame with the current model
    bootstrap_dataset.py  # Rebuild source-digits/ by glyph clustering
    fetch_crops.py        # Save a frame's rect crops
    capture_digits.py     # Capture time_4 crops
    smart_capture.py      # Transition-tracked capture
    recapture.py          # Model-labelled capture
    make_fixture.mjs      # Regenerate test/fixtures/frame-all-digits.png
  model/                  # Generated artifacts
    digit_classifier.onnx # Trained ONNX model
    metadata.json         # Preprocessing params (mean, std, dimensions)
  inference/              # Node.js inference package
    src/classifier.ts     # DigitClassifier class
    src/index.ts          # Public exports
    test/classifier.test.ts
```

## Multiple streams / per-player geometry

`config.json` is keyed by player id. Each stream has its own `capture` and
`geometry`; there is no global rect list and no inheritance.

```json
{
  "streams": {
    "player-1": {
      "capture": { "id": "capturadora-a", "device": "/dev/video0", "width": 720, "height": 480, "fps": 2 },
      "geometry": {
        "powerPixel": { "x": 200, "y": 47 },
        "modePixel": { "x": 470, "y": 60 },
        "rects": {
          "disc_1": { "x": 160, "y": 50, "width": 26, "height": 21 }
        }
      }
    }
  },
  "server": { "port": 3100 },
  "detection": { "minDigitConfidenceMargin": 0.15, "retryDelayMinMs": 30, "retryDelayMaxMs": 50 }
}
```

The full config must contain all nine rect names (`disc_1..3`, `track_1..2`,
`time_1..4`). See `config.json` for the complete example.

The training scripts take `--stream <id>` and use that stream's geometry. See
[Workflows](#workflows) for the commands.

### Template/k-NN classifier

The ONNX model is trained on the first player's OSD font. When another player's
font differs, a stream can use the template classifier instead:

```json
"player-2": {
  "classifier": "template",
  "binarizationThreshold": 170
}
```

It performs a k-NN match against the images in `digit-classifier/source-digits`
(26x21 PNGs), using the stream's `binarizationThreshold` for the input crop and
140 for the templates. `yarn build` copies `source-digits` into `dist/`, so the
production image contains the templates. The regression fixture
`test/fixtures/player2-playing.png` (raw live frame) reads 9/9 with this
classifier.

## Workflows

Run the commands below from `digit-classifier/train/` with the venv active
(`source .venv/bin/activate`). Each script points at a running parser's frame
endpoint; `--stream` picks the player geometry.

### Calibrating a new capture device or player

Draw the stream's rects/pixels on a frame, adjust its `geometry` in
`config.json` until the boxes sit on the glyphs, then check the reading:

```bash
python3 check_live.py --stream player-2 --url http://<host>:30002/frame
```

Full procedure: [Calibrating a stream](../docs/kubernetes.md#calibrating-a-stream).

### Choosing how to (re)build the dataset

| Situation | Use |
|---|---|
| New capture device/player, or the model misreads the display | `bootstrap_dataset.py` (see [Bootstrapping the dataset](#bootstrapping-the-dataset-new-capture-device-or-player)) |
| Model already works, you just want more samples | `recapture.py` |
| One uninterrupted playback and the starting labels are known | `smart_capture.py` |
| Just inspect `time_4` crops | `capture_digits.py` |

### How much data

Play a CD and collect for ~150 s: the seconds digit cycles 0-9 every second, so
that covers every class. 40-60 crops per class is enough. If the player is off
you will only collect black frames.

### Deploying a retrained model

Rebuild and deploy the service as usual (see
[`docs/kubernetes.md`](../docs/kubernetes.md)); `/display` keeps serving the
previous model until the deploy finishes.

## Training

### Prerequisites

- Python 3.10+

### Setup (first time only)

From this directory (`digit-classifier/`):

```bash
cd train && ./setup.sh
```

### Train the model

From this directory (`digit-classifier/`):

```bash
cd inference && yarn train
```

Or manually:

```bash
cd train && source .venv/bin/activate && python3 train.py
```

This will:

1. Discover all classes from `source-digits/` subfolders (0-9, blank, etc.)
2. Split 80% train / 20% validation (stratified)
3. Train a small CNN (max 100 epochs, early stopping on validation accuracy)
4. Print a classification report and confusion matrix
5. Export the model to `model/digit_classifier.onnx`
6. Write preprocessing params to `model/metadata.json`

### Binarization threshold

Images are preprocessed with a `min(R,G,B) > threshold` filter that converts pixels to black or white. This threshold is shared between training and inference:

1. **Training** defines it in `train/train.py` → `BINARIZATION_THRESHOLD`
2. Training writes it to `model/metadata.json` → `binarization_threshold`
3. **Inference** (`classifier.ts`) and the HTTP server (`/frame-filtered`) read it from `metadata.json`

To change the threshold: update `BINARIZATION_THRESHOLD` in `train.py` and retrain. The new value propagates automatically to inference via `metadata.json`.

### Adding more training data

Place new 26x21 PNG images in the corresponding `source-digits/<class>/` folder and re-train. Classes are discovered dynamically from subfolder names.

### Bootstrapping the dataset (new capture device or player)

When the capture setup changes, tracking digits over time is fragile: track
changes make the counter jump and silently mislabel the data. Instead, collect
raw crops and group them by glyph shape, label each group once, and rebuild the
dataset. The geometry comes from the selected stream in `config.json`.

```bash
cd train
source .venv/bin/activate

# 1. collect unlabelled crops from the stream
python3 bootstrap_dataset.py collect --stream player-1 --seconds 150

# 2. group by glyph shape -> bootstrap-work/player-1/clusters.png
python3 bootstrap_dataset.py cluster --stream player-1

# 3. open clusters.png (one row per cluster id, top->bottom) and write
#    bootstrap-work/player-1/labels.json, e.g. {"0": "blank", "1": "4", ...}

# 4. rebuild source-digits/ (up to 60 crops per class)
python3 bootstrap_dataset.py distribute --stream player-1 --per-class 60

# 5. retrain
python3 train.py
```

Verify the retrained model against the live feed before deploying:

```bash
python3 check_live.py --stream player-1 --url http://<host>:30002/frame --save-band /tmp/band.png
```

If the geometry changed, also regenerate the parser's end-to-end fixture:

```bash
node train/make_fixture.mjs --stream player-1 --url http://<host>:30002/frame
```

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
yarn install
yarn build
```

### Usage

```typescript
import { DigitClassifier } from 'digit-classifier';

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

#### `classifier.binarizationThreshold: number`

The `min(R,G,B)` threshold used for binarization, read from `metadata.json`. Available after `initialize()`.

#### `classifier.dispose(): Promise<void>`

Releases the ONNX runtime session.

### Scripts

| Script             | Description                        |
|--------------------|-------------------------------------|
| `yarn build`       | Compile TypeScript                  |
| `yarn test`        | Run classification tests            |
| `yarn verify`      | Build + run tests                   |
| `yarn train:setup` | Set up Python venv (first time only)|
| `yarn train`       | Train the model and export to ONNX  |

### Run tests

```bash
cd inference
yarn verify
```

Tests classify one sample image from each class folder and verify the prediction is correct.
