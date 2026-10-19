#!/usr/bin/env python3
"""
Bootstrap the training dataset from a live video feed.

Use this when the capture setup changes (new capture device, new player, new
display geometry). Tracking digits over time is fragile: track changes make the
counter jump and silently mislabel the data. Instead, this collects raw crops
and groups them by glyph shape, so no timing/OCR assumptions are involved. You
label each cluster once and the dataset is rebuilt.

Pipeline (geometry comes from the selected stream in config.json):
    python3 bootstrap_dataset.py collect --stream player-1 --seconds 150
    python3 bootstrap_dataset.py cluster --stream player-1
    # open <work-dir>/<stream>/clusters.png, then write labels.json next to it
    python3 bootstrap_dataset.py distribute --stream player-1 --per-class 60
    python3 train.py

labels.json maps each cluster id to a class label ("0".."9", "blank", ...).

The stream resolves as --stream > $FRAME_STREAM > first configured stream, and
the frame URL as --url > $FRAME_URL > http://localhost:3100/frame (see
frame_url.py).
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
from PIL import Image

from config_geometry import get_geometry, load_config, rect_list
from frame_url import (
    DEFAULT_FRAME_URL,
    resolve_frame_url,
    resolve_stream_id,
    with_stream,
)

BASE_DIR = Path(__file__).parent.parent          # digit-classifier/
SOURCE_DIR = BASE_DIR / "source-digits"
DEFAULT_WORK_DIR = BASE_DIR / "bootstrap-work"

CHANGE_THRESHOLD = 0.08  # mean |diff| above which two crops are different glyphs
MONTAGE_SCALE = 4
MONTAGE_PER_CLUSTER = 6


def crop(frame: Image.Image, rect: dict) -> Image.Image:
    x, y, w, h = rect["x"], rect["y"], rect["width"], rect["height"]
    return frame.crop((x, y, x + w, y + h))


def fetch_frame(url: str) -> Image.Image:
    with urlopen(url, timeout=5) as resp:
        return Image.open(BytesIO(resp.read())).convert("RGB")


def cmd_collect(args, rects: list[dict], stream_dir: Path) -> None:
    """Fetch frames for --seconds and save every rect crop, unlabelled."""
    url = with_stream(resolve_frame_url(args.url), args.stream_id)
    raw_dir = stream_dir / "raw"
    if raw_dir.exists() and not args.keep_existing:
        shutil.rmtree(raw_dir)
    for rect in rects:
        (raw_dir / rect["name"]).mkdir(parents=True, exist_ok=True)

    print(f"Stream: {args.stream_id}")
    print(f"Source: {url}")
    print(f"Rects:  {[r['name'] for r in rects]}")
    print(f"Output: {raw_dir}  ({args.seconds:.0f}s at {args.interval:.2f}s)\n")

    start = time.monotonic()
    frames = 0
    try:
        while time.monotonic() - start < args.seconds:
            try:
                frame = fetch_frame(url)
            except Exception as e:
                sys.stdout.write(f"\r[warn] {e}  ")
                sys.stdout.flush()
                time.sleep(0.5)
                continue
            for rect in rects:
                crop(frame, rect).save(raw_dir / rect["name"] / f"{frames:05d}.png")
            frames += 1
            sys.stdout.write(f"\rframes: {frames}  ({time.monotonic() - start:.0f}s)")
            sys.stdout.flush()
            time.sleep(args.interval)
    except KeyboardInterrupt:
        pass
    print(f"\ncollected {frames} frames -> {raw_dir}")


def cmd_cluster(args, stream_dir: Path) -> None:
    """Greedy clustering of all collected crops by glyph shape."""
    raw_dir = stream_dir / "raw"
    paths = sorted(raw_dir.glob("*/*.png"))
    if not paths:
        sys.exit(f"no crops in {raw_dir}; run 'collect' first")
    print(f"stream {args.stream_id}: {len(paths)} crops")

    seeds: list[np.ndarray] = []
    members: list[list[Path]] = []
    for p in paths:
        a = np.asarray(Image.open(p).convert("RGB"), dtype=np.float32) / 255.0
        best_i, best_d = -1, float("inf")
        for i, s in enumerate(seeds):
            d = np.abs(a - s).mean()
            if d < best_d:
                best_d, best_i = d, i
        if best_i >= 0 and best_d <= args.threshold:
            members[best_i].append(p)
        else:
            seeds.append(a)
            members.append([p])

    order = sorted(
        [i for i in range(len(seeds)) if len(members[i]) >= args.min_size],
        key=lambda i: -len(members[i]),
    )
    if not order:
        sys.exit("no clusters above --min-size; collect more frames or raise the threshold")

    mapping: dict[str, list[str]] = {}
    rows = []
    print(f"\n{len(seeds)} raw clusters, {len(order)} with >= {args.min_size} members\n")
    for cid, i in enumerate(order):
        mem = members[i]
        mapping[str(cid)] = [str(p) for p in mem]
        by_rect: dict[str, int] = {}
        for p in mem:
            by_rect[p.parent.name] = by_rect.get(p.parent.name, 0) + 1
        breakdown = "  ".join(f"{k}:{v}" for k, v in sorted(by_rect.items()))
        print(f"cluster {cid:2d}: {len(mem):4d}  [{breakdown}]")

        picks = [mem[int(k * len(mem) / MONTAGE_PER_CLUSTER)]
                 for k in range(min(MONTAGE_PER_CLUSTER, len(mem)))]
        rows.append(np.concatenate(
            [np.asarray(Image.open(p).convert("RGB")) for p in picks], axis=1))

    width = max(r.shape[1] for r in rows)
    canvas = np.zeros((sum(r.shape[0] + 2 for r in rows), width, 3), dtype=np.uint8)
    y = 0
    for row in rows:
        canvas[y:y + row.shape[0], :row.shape[1]] = row
        y += row.shape[0] + 2
    Image.fromarray(canvas).resize(
        (width * MONTAGE_SCALE, canvas.shape[0] * MONTAGE_SCALE), Image.NEAREST
    ).save(stream_dir / "clusters.png")

    (stream_dir / "clusters.json").write_text(json.dumps(mapping, indent=2))
    print(f"\nmontage -> {stream_dir / 'clusters.png'}  (rows top->bottom = cluster ids)")
    print(f"map     -> {stream_dir / 'clusters.json'}")
    print(f"Next: write {stream_dir / 'labels.json'} mapping cluster ids to labels, "
          "then run 'distribute'.")


def cmd_distribute(args, stream_dir: Path) -> None:
    """Build source-digits/ from clusters.json + labels.json."""
    clusters = json.loads((stream_dir / "clusters.json").read_text())
    if not args.labels.exists():
        sys.exit(
            f"{args.labels} not found; label the clusters from "
            f"{stream_dir / 'clusters.png'} first"
        )
    labels = json.loads(args.labels.read_text())

    unknown = sorted(set(labels) - set(clusters))
    if unknown:
        sys.exit(f"{args.labels} references unknown cluster ids: {unknown}")
    missing = sorted(set(clusters) - set(labels), key=int)
    if missing:
        print(f"[warn] clusters without a label (ignored): {missing}")

    by_class: dict[str, list[str]] = {}
    for cid, label in labels.items():
        by_class.setdefault(str(label), []).extend(clusters[cid])

    out_dir = args.out_dir
    if out_dir.exists():
        shutil.rmtree(out_dir)
    for label in sorted(by_class):
        (out_dir / str(label)).mkdir(parents=True)

    print("raw crops per class:")
    for label in sorted(by_class):
        print(f"  {label}: {len(by_class[label])}")

    print(f"\nwriting up to {args.per_class} per class -> {out_dir}")
    for label in sorted(by_class):
        crops = sorted(by_class[label])
        n = min(args.per_class, len(crops))
        picks = [crops[int(k * len(crops) / n)] for k in range(n)]
        for i, p in enumerate(picks):
            shutil.copy(p, out_dir / str(label) / f"{label}_{i:04d}.png")
        print(f"  {label}: {n}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--work-dir", type=Path, default=DEFAULT_WORK_DIR,
                        help=f"Working directory (default: {DEFAULT_WORK_DIR})")
    sub = parser.add_subparsers(dest="command", required=True)

    def add_stream(p):
        p.add_argument("--stream", default=None,
                       help="Stream id (default: $FRAME_STREAM or the first configured stream)")

    p = sub.add_parser("collect", help="collect unlabelled crops from the live feed")
    add_stream(p)
    p.add_argument("--seconds", type=float, default=150.0)
    p.add_argument("--interval", type=float, default=0.3)
    p.add_argument("--url", default=None,
                   help=f"Frame URL (default: $FRAME_URL or {DEFAULT_FRAME_URL})")
    p.add_argument("--keep-existing", action="store_true")
    p.set_defaults(func=cmd_collect)

    p = sub.add_parser("cluster", help="group collected crops by glyph shape")
    add_stream(p)
    p.add_argument("--threshold", type=float, default=CHANGE_THRESHOLD,
                   help=f"max mean|diff| to treat two crops as the same glyph "
                        f"(default {CHANGE_THRESHOLD})")
    p.add_argument("--min-size", type=int, default=3)
    p.set_defaults(func=cmd_cluster)

    p = sub.add_parser("distribute", help="build source-digits/ from labels.json")
    add_stream(p)
    p.add_argument("--labels", type=Path, default=None,
                   help="labels file (default: <work-dir>/<stream>/labels.json)")
    p.add_argument("--per-class", type=int, default=60)
    p.add_argument("--out-dir", type=Path, default=SOURCE_DIR,
                   help=f"dataset output (default: {SOURCE_DIR})")
    p.set_defaults(func=cmd_distribute)

    args = parser.parse_args()

    config = load_config()
    args.stream_id, geometry = get_geometry(config, resolve_stream_id(args.stream))
    stream_dir = args.work_dir / args.stream_id
    stream_dir.mkdir(parents=True, exist_ok=True)

    if args.command == "distribute" and args.labels is None:
        args.labels = stream_dir / "labels.json"

    if args.command == "collect":
        args.func(args, rect_list(geometry), stream_dir)
    else:
        args.func(args, stream_dir)


if __name__ == "__main__":
    main()
