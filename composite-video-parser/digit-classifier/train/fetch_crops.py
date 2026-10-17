#!/usr/bin/env python3
"""
Fetch one frame and save all rect crops to /tmp/cd_crops/.
Usage: python3 fetch_crops.py [url]
"""
import json
import sys
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

from PIL import Image

BASE_DIR = Path(__file__).parent.parent
CONFIG_PATH = BASE_DIR.parent / "config.json"
OUT_DIR = Path("/tmp/cd_crops")

url = sys.argv[1] if len(sys.argv) > 1 else "http://192.168.68.50:30002/frame"

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
