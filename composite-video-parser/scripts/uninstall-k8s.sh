#!/bin/bash
set -e

echo "🗑️  Uninstalling composite-video-parser..."
helm uninstall composite-video-parser

echo "✅ Uninstall complete!"
