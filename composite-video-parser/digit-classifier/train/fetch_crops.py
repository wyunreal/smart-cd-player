#!/usr/bin/env python3
"""
Fetch one frame and save all rect crops (defined in config.json) to /tmp/cd_crops/.

Usage:
    python3 fetch_crops.py --url http://<host>:30002/frame
    FRAME_URL=http://<host>:30002/frame python3 fetch_crops.py
"""

import argparse
import json
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

from PIL import Image

from frame_url import DEFAULT_FRAME_URL, resolve_frame_url

BASE_DIR = Path(__file__).parent.parent
CONFIG_PATH = BASE_DIR.parent / "config.json"
OUT_DIR = Path("/tmp/cd_crops")


def main():
    parser = argparse.ArgumentParser(description="Save the rect crops of one frame")
    parser.add_argument(
        "--url",
        default=None,
        help=f"Frame URL (default: $FRAME_URL or {DEFAULT_FRAME_URL})",
    )
    args = parser.parse_args()
    url = resolve_frame_url(args.url)

    with open(CONFIG_PATH) as f:
        config = json.load(f)

    OUT_DIR.mkdir(exist_ok=True)

    with urlopen(url, timeout=5) as resp:
        frame = Image.open(BytesIO(resp.read())).convert("RGB")

    for rect in config["rects"]:
        x, y, w, h = rect["x"], rect["y"], rect["width"], rect["height"]
        crop = frame.crop((x, y, x + w, y + h))
        crop.save(OUT_DIR / f"{rect['name']}.png")
        print(f"  {rect['name']}: ({x},{y} {w}x{h})")

    print(f"\nCrops saved to {OUT_DIR}/")


if __name__ == "__main__":
    main()
