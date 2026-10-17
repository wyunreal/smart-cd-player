#!/usr/bin/env python3
"""
Smart capture: tracks time digit transitions by pixel comparison to auto-label.

Starting labels are provided manually (from visual inspection of the first frame).
- time_4 changes every ~1s → cycles 0-9 automatically tracked
- time_3 changes every ~10s → tracked
- time_2 changes every ~60s → tracked
- time_1 changes every ~600s → tracked
- disc_* and track_* are fixed throughout (provided as start values)

Usage:
  python3 smart_capture.py \
    --disc1 1 --disc2 2 --disc3 blank \
    --track1 blank --track2 2 \
    --time1 blank --time2 3 --time3 3 --time4 9
"""

import argparse
import json
import sys
import time
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

import numpy as np
from PIL import Image

BASE_DIR = Path(__file__).parent.parent
CONFIG_PATH = BASE_DIR.parent / "config.json"
SOURCE_DIR = BASE_DIR / "source-digits"
URL = "http://192.168.68.50:30002/frame"
TARGET = 50
CHANGE_THRESHOLD = 0.08  # fraction of pixels that must differ to count as a digit change


def fetch_frame(url):
    with urlopen(url, timeout=5) as resp:
        return Image.open(BytesIO(resp.read())).convert("RGB")


def crop(frame, rect):
    x, y, w, h = rect["x"], rect["y"], rect["width"], rect["height"]
    return frame.crop((x, y, x + w, y + h))


def img_to_arr(img):
    return np.array(img, dtype=np.float32) / 255.0


def changed(prev, curr, threshold=CHANGE_THRESHOLD):
    diff = np.abs(img_to_arr(prev) - img_to_arr(curr))
    return diff.mean() > threshold


def next_digit(label):
    """Increment a digit label mod 10. 'blank' stays blank."""
    if label == "blank":
        return "blank"
    d = (int(label) + 1) % 10
    return str(d)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--disc1", required=True)
    parser.add_argument("--disc2", required=True)
    parser.add_argument("--disc3", required=True)
    parser.add_argument("--track1", required=True)
    parser.add_argument("--track2", required=True)
    parser.add_argument("--time1", required=True)
    parser.add_argument("--time2", required=True)
    parser.add_argument("--time3", required=True)
    parser.add_argument("--time4", required=True)
    parser.add_argument("--target", type=int, default=TARGET)
    parser.add_argument("--url", default=URL)
    args = parser.parse_args()

    with open(CONFIG_PATH) as f:
        config = json.load(f)

    rects = {r["name"]: r for r in config["rects"]}

    # Current label state
    labels = {
        "disc_1": args.disc1,
        "disc_2": args.disc2,
        "disc_3": args.disc3,
        "track_1": args.track1,
        "track_2": args.track2,
        "time_1": args.time1,
        "time_2": args.time2,
        "time_3": args.time3,
        "time_4": args.time4,
    }

    # time digit dependencies: when time_4 wraps 9→0, time_3 increments, etc.
    # We track wrap-arounds
    counts = {label: 0 for label in SOURCE_DIR.iterdir()
              if label.is_dir() and not label.name.startswith(".")}
    counts = {d.name: len(list(d.glob("*.png"))) for d in SOURCE_DIR.iterdir()
              if d.is_dir() and not d.name.startswith(".")}

    print("Starting label counts:", counts)
    print("Initial labels:", labels)
    print(f"Target: {args.target} per class\n")

    prev_crops = None
    frame_num = 0
    saved_total = 0

    try:
        while True:
            # Check if done
            all_done = all(counts.get(str(d), 0) >= args.target for d in range(10)) and \
                       counts.get("blank", 0) >= args.target
            if all_done:
                print("\nAll classes reached target!")
                break

            try:
                frame = fetch_frame(args.url)
            except Exception as e:
                sys.stdout.write(f"\r[warn] {e}  ")
                time.sleep(0.5)
                continue

            curr_crops = {name: crop(frame, rects[name]) for name in rects}
            frame_num += 1

            if prev_crops is not None:
                # Detect time_4 change
                if changed(prev_crops["time_4"], curr_crops["time_4"]):
                    old = labels["time_4"]
                    labels["time_4"] = next_digit(old)
                    # If time_4 wrapped 9→0, increment time_3
                    if old == "9" and labels["time_4"] == "0":
                        old3 = labels["time_3"]
                        labels["time_3"] = next_digit(old3)
                        # If time_3 wrapped, increment time_2
                        if old3 == "9" and labels["time_3"] == "0":
                            old2 = labels["time_2"]
                            labels["time_2"] = next_digit(old2)
                            if old2 == "9" and labels["time_2"] == "0":
                                labels["time_1"] = next_digit(labels["time_1"])

            # Save each crop to its labeled folder
            frame_saved = 0
            for name, img in curr_crops.items():
                label = labels[name]
                cur_count = counts.get(label, 0)
                if cur_count < args.target:
                    out_path = SOURCE_DIR / label / f"cap_{frame_num:05d}_{name}.png"
                    img.save(out_path)
                    counts[label] = cur_count + 1
                    frame_saved += 1
                    saved_total += 1

            prev_crops = curr_crops

            status = " ".join(f"{k}:{counts.get(k,0)}" for k in
                              [str(i) for i in range(10)] + ["blank"])
            sys.stdout.write(f"\rFrame {frame_num} | saved {saved_total} | {status}  ")
            sys.stdout.flush()

            time.sleep(0.6)

    except KeyboardInterrupt:
        pass

    print(f"\n\nFinal counts:")
    for k in [str(i) for i in range(10)] + ["blank"]:
        print(f"  {k}: {counts.get(k, 0)}")


if __name__ == "__main__":
    main()
