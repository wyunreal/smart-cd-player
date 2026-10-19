#!/usr/bin/env python3
"""
Capture digit crops from the live video feed.

Grabs frames from the composite-video-parser HTTP server, extracts the
seconds-unit digit region (time_4), and saves each crop as a PNG file.
Run while a CD is playing so the digit cycles through 0-9.

Usage:
    python3 capture_digits.py --fps 2
    python3 capture_digits.py --fps 4 --stream player-1 --output ./captured --url http://localhost:3100/frame

Press Ctrl+C to stop.
"""

import argparse
import sys
import time
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

from PIL import Image

from config_geometry import get_geometry, load_config
from frame_url import (
    DEFAULT_FRAME_URL,
    resolve_frame_url,
    resolve_stream_id,
    with_stream,
)

# Region used only when --region is passed explicitly; by default the time_4
# rect comes from the selected stream's geometry.


def capture_loop(url: str, fps: float, output_dir: Path, region: tuple[int, int, int, int], prefix: str = "frame"):
    output_dir.mkdir(parents=True, exist_ok=True)
    x, y, w, h = region
    interval = 1.0 / fps
    frame_num = 0

    print(f"Capturing region ({x},{y} {w}x{h}) at {fps} fps")
    print(f"Output: {output_dir}/")
    print(f"Source: {url}")
    print("Press Ctrl+C to stop.\n")

    try:
        while True:
            t0 = time.monotonic()
            try:
                with urlopen(url, timeout=5) as resp:
                    data = resp.read()
                img = Image.open(BytesIO(data)).convert("RGB")
                crop = img.crop((x, y, x + w, y + h))
                out_path = output_dir / f"{prefix}_{frame_num:04d}.png"
                crop.save(out_path)
                frame_num += 1
                sys.stdout.write(f"\rCaptured {frame_num} frames")
                sys.stdout.flush()
            except Exception as e:
                sys.stdout.write(f"\r[error] {e}")
                sys.stdout.flush()

            elapsed = time.monotonic() - t0
            sleep_time = interval - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)
    except KeyboardInterrupt:
        print(f"\n\nDone. Saved {frame_num} frames to {output_dir}/")


def main():
    parser = argparse.ArgumentParser(description="Capture digit crops from live video feed")
    parser.add_argument("--fps", type=float, default=2.0, help="Capture rate in frames per second (default: 2)")
    parser.add_argument("--output", type=str, default="./captured", help="Output directory (default: ./captured)")
    parser.add_argument("--url", type=str, default=None,
                        help=f"Frame URL (default: $FRAME_URL or {DEFAULT_FRAME_URL})")
    parser.add_argument("--stream", type=str, default=None,
                        help="Stream id (default: $FRAME_STREAM or the first configured stream)")
    parser.add_argument("--region", type=str, default=None,
                        help="Crop region as x,y,w,h (default: time_4 of the stream geometry)")
    parser.add_argument("--prefix", type=str, default="frame",
                        help="Filename prefix (default: frame)")
    args = parser.parse_args()
    args.stream = resolve_stream_id(args.stream)
    args.url = with_stream(resolve_frame_url(args.url), args.stream)

    config = load_config()
    args.stream, geometry = get_geometry(config, args.stream)
    time_4 = geometry["rects"]["time_4"]

    region = (
        time_4["x"],
        time_4["y"],
        time_4["width"],
        time_4["height"],
    )
    if args.region:
        parts = [int(v) for v in args.region.split(",")]
        if len(parts) != 4:
            parser.error("--region must be x,y,w,h")
        region = tuple(parts)

    print(f"Stream: {args.stream}")
    capture_loop(args.url, args.fps, Path(args.output), region, args.prefix)


if __name__ == "__main__":
    main()
