#!/usr/bin/env python3
"""
Auto-capture and label digit crops from a live frame URL.

Fetches frames, crops each rect defined in config.json, classifies them
with the current ONNX model, and saves high-confidence crops to the
source-digits/{label}/ training folders.

Replaces all existing training images.

Usage:
    python3 recapture.py
    python3 recapture.py --url http://192.168.68.50:30002/frame --target 50 --margin 0.6
"""

import argparse
import json
import shutil
import sys
import time
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

import numpy as np
import onnxruntime as ort
from PIL import Image

BASE_DIR = Path(__file__).parent.parent
CONFIG_PATH = BASE_DIR.parent / "config.json"
MODEL_PATH = BASE_DIR / "model" / "digit_classifier.onnx"
METADATA_PATH = BASE_DIR / "model" / "metadata.json"
SOURCE_DIR = BASE_DIR / "source-digits"

DEFAULT_URL = "http://192.168.68.50:30002/frame"
DEFAULT_TARGET = 50
DEFAULT_MARGIN = 0.6


def load_config():
    with open(CONFIG_PATH) as f:
        return json.load(f)


def load_model():
    with open(METADATA_PATH) as f:
        meta = json.load(f)
    session = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
    return session, meta


def preprocess(crop: Image.Image, meta: dict) -> np.ndarray:
    img = crop.convert("RGB").resize(
        (meta["input_width"], meta["input_height"]), Image.NEAREST
    )
    pixels = np.array(img, dtype=np.float32)
    min_rgb = np.minimum(np.minimum(pixels[:, :, 0], pixels[:, :, 1]), pixels[:, :, 2])
    binary = np.where(min_rgb > meta["binarization_threshold"], 1.0, 0.0).astype(np.float32)
    tensor = (binary - meta["mean"]) / meta["std"]
    return tensor.reshape(1, 1, meta["input_height"], meta["input_width"])


def classify(session, meta, tensor: np.ndarray) -> tuple[str, float]:
    outputs = session.run(None, {"input": tensor})
    logits = outputs[0][0]
    exps = np.exp(logits - logits.max())
    probs = exps / exps.sum()
    sorted_probs = np.sort(probs)[::-1]
    margin = float(sorted_probs[0] - sorted_probs[1])
    label = meta["class_labels"][int(probs.argmax())]
    return label, margin


def fetch_frame(url: str) -> "Image.Image | None":
    try:
        with urlopen(url, timeout=5) as resp:
            return Image.open(BytesIO(resp.read())).convert("RGB")
    except Exception as e:
        print(f"\n[warn] fetch error: {e}")
        return None


def clear_source_dirs(labels: list[str]):
    for label in labels:
        d = SOURCE_DIR / label
        if d.exists():
            shutil.rmtree(d)
        d.mkdir(parents=True)


def main():
    parser = argparse.ArgumentParser(description="Auto-capture training images from live frames")
    parser.add_argument("--url", default=DEFAULT_URL, help="Frame URL")
    parser.add_argument("--target", type=int, default=DEFAULT_TARGET, help="Target images per class")
    parser.add_argument("--margin", type=float, default=DEFAULT_MARGIN, help="Min confidence margin to accept")
    args = parser.parse_args()

    print("Loading config and model...")
    config = load_config()
    rects = config["rects"]
    session, meta = load_model()
    labels = meta["class_labels"]

    print(f"Classes: {labels}")
    print(f"Rects: {[r['name'] for r in rects]}")
    print(f"Target: {args.target} images per class, min margin: {args.margin}")
    print()

    # Clear and recreate source-digits folders
    print("Clearing existing training images...")
    clear_source_dirs(labels)

    counts = {label: 0 for label in labels}
    frame_num = 0
    saved_total = 0

    print("Capturing... Press Ctrl+C to stop early.\n")

    try:
        while True:
            remaining = {l: args.target - c for l, c in counts.items() if c < args.target}
            if not remaining:
                print("\nAll classes reached target. Done!")
                break

            frame = fetch_frame(args.url)
            if frame is None:
                time.sleep(0.5)
                continue

            frame_num += 1
            frame_saved = 0

            for rect in rects:
                x, y, w, h = rect["x"], rect["y"], rect["width"], rect["height"]
                crop = frame.crop((x, y, x + w, y + h))
                tensor = preprocess(crop, meta)
                label, margin = classify(session, meta, tensor)

                if margin >= args.margin and counts[label] < args.target:
                    idx = counts[label]
                    out_path = SOURCE_DIR / label / f"{rect['name']}_{frame_num:05d}_{idx:03d}.png"
                    crop.save(out_path)
                    counts[label] += 1
                    frame_saved += 1
                    saved_total += 1

            status = "  ".join(f"{l}:{counts[l]}/{args.target}" for l in labels)
            sys.stdout.write(f"\rFrame {frame_num} | saved {saved_total} | {status}")
            sys.stdout.flush()

            time.sleep(0.3)

    except KeyboardInterrupt:
        print()

    print(f"\nFinal counts:")
    for label in labels:
        print(f"  {label}: {counts[label]} images")
    print(f"\nTotal saved: {saved_total} images to {SOURCE_DIR}/")


if __name__ == "__main__":
    main()
