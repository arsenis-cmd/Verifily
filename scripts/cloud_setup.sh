#!/usr/bin/env bash
# Setup script for RunPod A100 training environment.
# Usage: cd /workspace && bash cloud_setup.sh
set -e

echo "=== Verifily v7 — Cloud Training Setup ==="

echo "1. Installing Python dependencies..."
pip install -r cloud_requirements.txt

echo "2. Pre-downloading deberta-v3-large model..."
python3 -c "from transformers import AutoModel, AutoTokenizer; AutoModel.from_pretrained('microsoft/deberta-v3-large'); AutoTokenizer.from_pretrained('microsoft/deberta-v3-large')"

echo "=== Setup complete. Run: python3 cloud_train.py 2>&1 | tee training.log ==="
