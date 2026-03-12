#!/bin/bash
set -e

IMAGE_NAME="audio-streamer"

echo "🗑️  Uninstalling ${IMAGE_NAME} from k3s..."
helm uninstall ${IMAGE_NAME}
echo "✅ Uninstalled ${IMAGE_NAME}"
