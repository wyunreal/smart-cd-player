"""Resolve the video frame URL used by the capture/training scripts.

Priority: the ``--url`` argument, then the ``FRAME_URL`` environment variable,
then a safe localhost default. This keeps deployment-specific hosts (LAN IPs,
domains) out of the source tree.

Example:
    FRAME_URL=http://<host>:30002/frame python3 recapture.py
"""

import os

DEFAULT_FRAME_URL = "http://localhost:3100/frame"


def resolve_frame_url(cli_url: "str | None" = None) -> str:
    """Return the frame URL to use, from CLI arg > $FRAME_URL > default."""
    return cli_url or os.environ.get("FRAME_URL") or DEFAULT_FRAME_URL
