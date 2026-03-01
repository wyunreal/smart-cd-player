#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Creating virtual environment..."
python3 -m venv .venv

echo "Activating virtual environment..."
source .venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "Setup complete. To train the model run:"
echo "  cd train && source .venv/bin/activate && python3 train.py"
