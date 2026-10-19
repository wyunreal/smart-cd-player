"""Resolve the video frame URL used by the capture/training scripts.

Priority: the ``--url`` argument, then the ``FRAME_URL`` environment variable,
then a safe localhost default. This keeps deployment-specific hosts (LAN IPs,
domains) out of the source tree.

The optional stream id (``--stream`` or ``FRAME_STREAM``) is appended as the
``id`` query parameter, which selects one stream from the parser.

Example:
    FRAME_URL=http://<host>:30002/frame FRAME_STREAM=player-2 \
        python3 recapture.py
"""

import os
from urllib.parse import quote

DEFAULT_FRAME_URL = "http://localhost:3100/frame"


def resolve_frame_url(cli_url: "str | None" = None) -> str:
    """Return the frame URL to use, from CLI arg > $FRAME_URL > default."""
    return cli_url or os.environ.get("FRAME_URL") or DEFAULT_FRAME_URL


def resolve_stream_id(cli_stream: "str | None" = None) -> "str | None":
    """Return the stream id to use, from CLI arg > $FRAME_STREAM."""
    return cli_stream or os.environ.get("FRAME_STREAM") or None


def with_stream(url: str, stream_id: "str | None") -> str:
    """Append ``id=<stream_id>`` unless the URL already carries an id."""
    if not stream_id or "id=" in url:
        return url
    separator = "&" if "?" in url else "?"
    return f"{url}{separator}id={quote(stream_id)}"
