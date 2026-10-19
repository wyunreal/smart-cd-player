"""Resolve per-stream geometry from config.json.

The public stream id is the key in ``config["streams"]``. Geometry is stored
inside each stream, so training/calibration scripts must know which stream they
are working with.
"""

import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DEFAULT_CONFIG_PATH = BASE_DIR.parent / "config.json"


def load_config(path: "str | Path | None" = None) -> dict:
    config_path = path or os.environ.get("CONFIG_PATH") or DEFAULT_CONFIG_PATH
    with open(config_path, encoding="utf-8") as f:
        return json.load(f)


def get_stream(config: dict, stream_id: "str | None" = None):
    """Return (stream_id, stream_config).

    When stream_id is omitted, use the first configured stream.
    """
    streams = config.get("streams", {})
    if not streams:
        raise SystemExit("Config has no streams")

    if stream_id:
        if stream_id not in streams:
            available = ", ".join(streams)
            raise SystemExit(
                f"Unknown stream {stream_id!r}. Available: {available}"
            )
        return stream_id, streams[stream_id]

    first_id = next(iter(streams))
    return first_id, streams[first_id]


def get_geometry(config: dict, stream_id: "str | None" = None):
    """Return (stream_id, geometry) for the requested stream."""
    stream_id, stream = get_stream(config, stream_id)
    return stream_id, stream["geometry"]


def rect_list(geometry: dict) -> list[dict]:
    """Convert the rect map to a list of dicts with a ``name`` field."""
    return [
        {"name": name, **rect}
        for name, rect in geometry["rects"].items()
    ]
