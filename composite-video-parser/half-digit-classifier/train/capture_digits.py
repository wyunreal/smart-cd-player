#!/usr/bin/env python3
"""
Capture digit crops from the live video feed.

Grabs frames from the composite-video-parser HTTP server, extracts the
seconds-unit digit region (time_4), and saves each crop as a PNG file.
Run while a CD is playing so the digit cycles through 0-9.

Usage:
    python3 capture_digits.py --fps 2
    python3 capture_digits.py --fps 4 --output ./captured --url http://localhost:3100/frame

Press Ctrl+C to stop.
"""

import argparse
import sys
import time
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

from PIL import Image

# Digit region: time_4 (seconds unit) from config.json
DEFAULT_REGION = (598, 0, 26, 21)  # x, y, width, height


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
    parser.add_argument("--fps", type=float, required=True, help="Capture rate in frames per second")
    parser.add_argument("--output", type=str, default="./captured", help="Output directory (default: ./captured)")
    parser.add_argument("--url", type=str, default="http://localhost:3100/frame", help="Frame URL")
    parser.add_argument("--region", type=str, default=None,
                        help="Crop region as x,y,w,h (default: 598,0,26,21 = time_4)")
    parser.add_argument("--prefix", type=str, default="frame",
                        help="Filename prefix (default: frame)")
    args = parser.parse_args()

    region = DEFAULT_REGION
    if args.region:
        parts = [int(v) for v in args.region.split(",")]
        if len(parts) != 4:
            parser.error("--region must be x,y,w,h")
        region = tuple(parts)

    capture_loop(args.url, args.fps, Path(args.output), region, args.prefix)


if __name__ == "__main__":
    main()
