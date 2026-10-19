#!/usr/bin/env python3
"""
Fetch one frame and save all rect crops (defined in config.json) to /tmp/cd_crops/.

Usage:
    python3 fetch_crops.py --stream player-1 --url http://<host>:30002/frame
    FRAME_URL=http://<host>:30002/frame FRAME_STREAM=player-1 python3 fetch_crops.py
"""

import argparse
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

from PIL import Image

from config_geometry import get_geometry, load_config, rect_list
from frame_url import (
    DEFAULT_FRAME_URL,
    resolve_frame_url,
    resolve_stream_id,
    with_stream,
)

OUT_DIR = Path("/tmp/cd_crops")


def main():
    parser = argparse.ArgumentParser(description="Save the rect crops of one frame")
    parser.add_argument(
        "--url",
        default=None,
        help=f"Frame URL (default: $FRAME_URL or {DEFAULT_FRAME_URL})",
    )
    parser.add_argument(
        "--stream",
        default=None,
        help="Stream id (default: $FRAME_STREAM or the first configured stream)",
    )
    args = parser.parse_args()

    stream_id = resolve_stream_id(args.stream)
    url = with_stream(resolve_frame_url(args.url), stream_id)

    config = load_config()
    stream_id, geometry = get_geometry(config, stream_id)
    rects = rect_list(geometry)

    OUT_DIR.mkdir(exist_ok=True)

    with urlopen(url, timeout=5) as resp:
        frame = Image.open(BytesIO(resp.read())).convert("RGB")

    print(f"Stream: {stream_id}")
    for rect in rects:
        x, y, w, h = rect["x"], rect["y"], rect["width"], rect["height"]
        crop = frame.crop((x, y, x + w, y + h))
        crop.save(OUT_DIR / f"{rect['name']}.png")
        print(f"  {rect['name']}: ({x},{y} {w}x{h})")

    print(f"\nCrops saved to {OUT_DIR}/")


if __name__ == "__main__":
    main()
