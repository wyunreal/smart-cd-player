#!/usr/bin/env python3
"""Draw a stream's configured rects and indicator pixels on a frame.

Useful for calibrating the geometry of each capture card independently.

Usage:
    python3 annotate_rects.py --stream player-2 --url http://<host>:30002/frame
    python3 annotate_rects.py --stream player-2 --file /tmp/p2.png
"""

import argparse
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

from PIL import Image, ImageDraw

from config_geometry import get_geometry, load_config, rect_list
from frame_url import (
    DEFAULT_FRAME_URL,
    resolve_frame_url,
    resolve_stream_id,
    with_stream,
)


def load_frame(url: str, file_path: "str | None") -> Image.Image:
    if file_path:
        return Image.open(file_path).convert("RGB")
    with urlopen(url, timeout=5) as resp:
        return Image.open(BytesIO(resp.read())).convert("RGB")


def main():
    parser = argparse.ArgumentParser(
        description="Annotate a frame with a stream's geometry"
    )
    parser.add_argument(
        "--stream",
        default=None,
        help="Stream id (default: $FRAME_STREAM or the first configured stream)",
    )
    parser.add_argument(
        "--url",
        default=None,
        help=f"Frame URL (default: $FRAME_URL or {DEFAULT_FRAME_URL})",
    )
    parser.add_argument(
        "--file",
        default=None,
        help="Use a local frame file instead of fetching one",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output PNG path (default: /tmp/<stream>-annotated.png)",
    )
    parser.add_argument(
        "--scale",
        type=int,
        default=1,
        help="Scale the annotated image (default: 1)",
    )
    args = parser.parse_args()

    config = load_config()
    stream_id, geometry = get_geometry(config, resolve_stream_id(args.stream))
    url = with_stream(resolve_frame_url(args.url), stream_id)

    image = load_frame(url, args.file)
    draw = ImageDraw.Draw(image)

    for rect in rect_list(geometry):
        x = rect["x"]
        y = rect["y"]
        w = rect["width"]
        h = rect["height"]
        draw.rectangle([x, y, x + w - 1, y + h - 1], outline="red", width=1)
        draw.text((x, max(0, y - 11)), rect["name"], fill="red")

    power = geometry["powerPixel"]
    draw.ellipse(
        [power["x"] - 4, power["y"] - 4, power["x"] + 4, power["y"] + 4],
        outline="black",
        width=1,
    )
    draw.ellipse(
        [power["x"] - 3, power["y"] - 3, power["x"] + 3, power["y"] + 3],
        outline="lime",
        width=2,
    )
    draw.text((power["x"] + 5, max(0, power["y"] - 5)), "power", fill="lime")

    mode = geometry["modePixel"]
    draw.ellipse(
        [mode["x"] - 4, mode["y"] - 4, mode["x"] + 4, mode["y"] + 4],
        outline="black",
        width=1,
    )
    draw.ellipse(
        [mode["x"] - 3, mode["y"] - 3, mode["x"] + 3, mode["y"] + 3],
        outline="blue",
        width=2,
    )
    draw.text((mode["x"] + 5, max(0, mode["y"] - 5)), "mode", fill="blue")

    if args.scale > 1:
        image = image.resize(
            (image.width * args.scale, image.height * args.scale),
            Image.Resampling.NEAREST,
        )

    output = Path(args.output or f"/tmp/{stream_id}-annotated.png")
    image.save(output)
    print(f"Stream: {stream_id}")
    print(f"Source: {args.file or url}")
    print(f"Saved:  {output}")


if __name__ == "__main__":
    main()
