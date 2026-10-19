#!/usr/bin/env python3
"""
Run the current ONNX model against a live frame and print what it sees.

Handy while bringing up a new capture device / player: it shows the selected
stream's power and mode pixel readings plus the model prediction (and
confidence margin) for every rect, mirroring the TypeScript inference
preprocessing.

Usage:
    python3 check_live.py --stream player-1
    python3 check_live.py --stream player-2 --url http://<host>:30002/frame \
        --save-band /tmp/band.png
"""

import argparse
import json
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

import numpy as np
import onnxruntime as ort
from PIL import Image

from config_geometry import get_stream, load_config, rect_list
from frame_url import (
    DEFAULT_FRAME_URL,
    resolve_frame_url,
    resolve_stream_id,
    with_stream,
)

BASE_DIR = Path(__file__).parent.parent          # digit-classifier/
MODEL_PATH = BASE_DIR / "model" / "digit_classifier.onnx"
METADATA_PATH = BASE_DIR / "model" / "metadata.json"


def main() -> None:
    parser = argparse.ArgumentParser(description="Classify the rects of one live frame")
    parser.add_argument("--stream", default=None,
                        help="Stream id (default: $FRAME_STREAM or the first configured stream)")
    parser.add_argument("--url", default=None,
                        help=f"Frame URL (default: $FRAME_URL or {DEFAULT_FRAME_URL})")
    parser.add_argument("--model", type=Path, default=MODEL_PATH)
    parser.add_argument("--metadata", type=Path, default=METADATA_PATH)
    parser.add_argument("--save-band", type=Path, default=None,
                        help="also save the header strip (rows 44..80) as PNG")
    args = parser.parse_args()

    config = load_config()
    stream_id, stream = get_stream(config, resolve_stream_id(args.stream))
    geometry = stream["geometry"]
    width = stream["capture"]["width"]

    meta = json.loads(args.metadata.read_text())
    session = ort.InferenceSession(str(args.model), providers=["CPUExecutionProvider"])

    url = with_stream(resolve_frame_url(args.url), stream_id)
    with urlopen(url, timeout=10) as resp:
        frame = Image.open(BytesIO(resp.read())).convert("RGB")
    pixels = frame.load()

    px = geometry["powerPixel"]
    r, g, b = pixels[px["x"], px["y"]]
    powered = g > 30 and g > r and g > b

    mx = geometry["modePixel"]
    min_rgb = min(pixels[mx["x"], mx["y"]])
    stopped = min_rgb > meta["binarization_threshold"]
    mode = "off" if not powered else ("stopped" if stopped else "detect-digits")

    print(f"Stream: {stream_id}   Source: {url}")
    print(f"model:  {args.model.name}  classes={len(meta['class_labels'])}  "
          f"val_acc={meta.get('validation_accuracy')}")
    print(f"powerPixel ({px['x']},{px['y']}) rgb={(r, g, b)} -> powered={powered}")
    print(f"modePixel  ({mx['x']},{mx['y']}) min_rgb={min_rgb} -> mode={mode}\n")

    for rect in rect_list(geometry):
        crop = frame.crop((rect["x"], rect["y"],
                           rect["x"] + rect["width"], rect["y"] + rect["height"]))
        crop = crop.resize((meta["input_width"], meta["input_height"]), Image.NEAREST)
        arr = np.asarray(crop, dtype=np.float32)
        min_rgb = np.minimum(np.minimum(arr[:, :, 0], arr[:, :, 1]), arr[:, :, 2])
        binary = np.where(min_rgb > meta["binarization_threshold"], 1.0, 0.0).astype(np.float32)
        tensor = ((binary - meta["mean"]) / meta["std"]).reshape(
            1, 1, meta["input_height"], meta["input_width"])
        logits = session.run(None, {"input": tensor})[0][0]
        e = np.exp(logits - logits.max())
        probs = e / e.sum()
        order = np.argsort(probs)[::-1]
        label = meta["class_labels"][order[0]]
        margin = float(probs[order[0]] - probs[order[1]])
        print(f"  {rect['name']:8s} -> {label:>5s}  p={probs[order[0]]:.3f}  margin={margin:.3f}")

    if args.save_band:
        frame.crop((0, 44, width, 80)).save(args.save_band)
        print(f"\nband saved to {args.save_band}")


if __name__ == "__main__":
    main()
