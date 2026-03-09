#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/output"
rm -rf "$OUT"

echo "=== Verifily NL2SQL Demo ==="
echo ""

echo "1. Validate dataset"
python3 -m verifily_cli_v1.cli nl2sql validate --in "$DIR/dataset.jsonl" --output "$OUT/validate.json"
echo ""

echo "2. Fingerprint dataset"
python3 -m verifily_cli_v1.cli nl2sql fingerprint --in "$DIR/dataset.jsonl" --out "$OUT/fingerprinted" --verbose
echo ""

echo "3. Split dataset (leakage-resistant, 20% eval)"
python3 -m verifily_cli_v1.cli nl2sql split --in "$OUT/fingerprinted/dataset.jsonl" --out-dir "$OUT/splits" --eval-ratio 0.2 --seed 42
echo ""

echo "4. Gate (contamination check on the split)"
python3 -m verifily_cli_v1.cli nl2sql gate --train "$OUT/splits/train.jsonl" --eval "$OUT/splits/eval.jsonl" --output "$OUT/gate.json" || true
echo ""

echo "5. Standard ingest (schema auto-detect)"
python3 -m verifily_cli_v1.cli ingest --in "$DIR/dataset.jsonl" --out "$OUT/ingested" --schema nl2sql
echo ""

echo "=== Done ==="
echo "Artifacts written to: $OUT"
