#!/usr/bin/env python3
"""Download and prepare real human-annotated datasets for model training.

Downloads from HuggingFace Hub:
- nvidia/HelpSteer2 — multi-axis quality annotations (coherence, helpfulness, complexity)
- openbmb/UltraFeedback — instruction-response pairs with per-axis quality scores
- OpenAssistant/oasst2 — human-ranked messages with quality + toxicity

Produces a unified combined_quality.jsonl with 4-axis labels (0-1 normalized).
Missing axes are set to null for missing-label masking during training.

Usage:
    python scripts/download_training_data.py

Output:
    verifily_cli_v1/data/helpsteer2.jsonl
    verifily_cli_v1/data/ultrafeedback.jsonl
    verifily_cli_v1/data/oasst2.jsonl
    verifily_cli_v1/data/combined_quality.jsonl  (unified 4-axis)
"""

from __future__ import annotations

import json
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "verifily_cli_v1", "data",
)

# Unified axes: coherence, informativeness, complexity, overall (all 0-1)
AXES = ["coherence", "informativeness", "complexity", "overall"]


def download_helpsteer2(max_rows: int = 21000, seed: int = 42) -> str:
    """Download nvidia/HelpSteer2 — multi-axis human annotations.

    Full dataset: ~20k rows. We take all of them.
    Axes: coherence(0-4), helpfulness(0-4), complexity(0-4), correctness(0-4)
    """
    from datasets import load_dataset

    print("  Loading nvidia/HelpSteer2...")
    ds = load_dataset("nvidia/HelpSteer2", split="train")
    print(f"  Loaded {len(ds)} rows")

    rng = random.Random(seed)
    indices = list(range(len(ds)))
    rng.shuffle(indices)
    indices = indices[:max_rows]

    output_path = os.path.join(DATA_DIR, "helpsteer2.jsonl")
    count = 0
    with open(output_path, "w") as f:
        for idx in indices:
            row = ds[idx]
            response = row["response"]
            text = f"{row['prompt']} {response}"
            if len(response.strip()) < 20:
                continue
            record = {
                "text": text.strip(),
                "response_text": response.strip(),
                "prompt": row["prompt"],
                "response": response,
                "helpfulness": float(row["helpfulness"]),
                "correctness": float(row["correctness"]),
                "coherence": float(row["coherence"]),
                "complexity": float(row["complexity"]),
                "verbosity": float(row["verbosity"]),
            }
            f.write(json.dumps(record) + "\n")
            count += 1

    print(f"  Saved {count} rows to {output_path}")
    return output_path


def download_ultrafeedback(max_rows: int = 64000, seed: int = 42) -> str:
    """Download openbmb/UltraFeedback — GPT-4 quality scored instruction pairs.

    Full dataset: ~64k rows. We take all of them.
    Has per-axis: helpfulness, honesty, instruction_following, truthfulness (1-5 scale).
    """
    from datasets import load_dataset

    print("  Loading openbmb/UltraFeedback...")
    ds = load_dataset("openbmb/UltraFeedback", split="train")
    print(f"  Loaded {len(ds)} rows")

    rng = random.Random(seed)
    indices = list(range(len(ds)))
    rng.shuffle(indices)

    output_path = os.path.join(DATA_DIR, "ultrafeedback.jsonl")
    count = 0
    with open(output_path, "w") as f:
        for idx in indices:
            if count >= max_rows:
                break
            row = ds[idx]
            instruction = row.get("instruction", "")
            completions = row.get("completions", [])
            if not completions or not instruction:
                continue

            for comp in completions:
                annotations = comp.get("annotations", {})
                overall = annotations.get("overall_rating")
                if overall is None:
                    rating = comp.get("overall_score")
                    if rating is not None:
                        overall = rating

                response_text = comp.get("response", "")
                if not response_text or len(response_text.strip()) < 20:
                    continue

                try:
                    if isinstance(overall, str):
                        overall = float(overall)
                    elif isinstance(overall, (int, float)):
                        overall = float(overall)
                    else:
                        continue
                except (ValueError, TypeError):
                    continue

                text = f"{instruction} {response_text}"
                record = {
                    "text": text.strip(),
                    "instruction": instruction,
                    "response": response_text,
                    "overall_score": overall,
                }

                for axis in ["helpfulness", "honesty", "instruction_following", "truthfulness"]:
                    axis_data = annotations.get(axis)
                    if axis_data and isinstance(axis_data, dict):
                        rating_val = axis_data.get("Rating") or axis_data.get("rating")
                        if rating_val is not None:
                            try:
                                record[axis] = float(rating_val)
                            except (ValueError, TypeError):
                                pass

                f.write(json.dumps(record) + "\n")
                count += 1
                break

    print(f"  Saved {count} rows to {output_path}")
    return output_path


def download_oasst2(max_rows: int = 62000, seed: int = 42) -> str:
    """Download OpenAssistant/oasst2 — human-ranked messages.

    Full dataset: ~128k rows, ~61k English. We take all English.
    Has: rank (0-3), quality (0-1), helpfulness (0-1).
    """
    from datasets import load_dataset

    print("  Loading OpenAssistant/oasst2...")
    ds = load_dataset("OpenAssistant/oasst2", split="train")
    print(f"  Loaded {len(ds)} rows")

    rng = random.Random(seed)
    indices = list(range(len(ds)))
    rng.shuffle(indices)

    output_path = os.path.join(DATA_DIR, "oasst2.jsonl")
    count = 0
    with open(output_path, "w") as f:
        for idx in indices:
            if count >= max_rows:
                break
            row = ds[idx]
            text = row.get("text", "")
            if len(text.strip()) < 20:
                continue

            lang = row.get("lang", "en")
            if lang != "en":
                continue

            record = {
                "text": text.strip(),
                "role": row.get("role", ""),
                "rank": row.get("rank"),
                "quality": row.get("quality"),
                "toxicity": row.get("toxicity"),
                "humor": row.get("humor"),
                "helpfulness": row.get("helpfulness"),
                "creativity": row.get("creativity"),
                "lang": lang,
            }
            record = {k: v for k, v in record.items() if v is not None}

            f.write(json.dumps(record) + "\n")
            count += 1

    print(f"  Saved {count} rows to {output_path}")
    return output_path


# ---------------------------------------------------------------------------
# Unified label mapping
# ---------------------------------------------------------------------------

def _clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def unify_helpsteer2(path: str):
    """Map HelpSteer2 to unified 4-axis format.

    coherence(0-4)→coherence, helpfulness(0-4)→informativeness,
    complexity(0-4)→complexity, correctness(0-4)→overall.
    """
    rows = []
    with open(path) as f:
        for line in f:
            row = json.loads(line)
            text = row.get("response_text", "") or row.get("text", "")
            if len(text.strip()) < 20:
                continue
            rows.append({
                "text": text.strip(),
                "source": "helpsteer2",
                "coherence": _clamp(row.get("coherence", 2.0) / 4.0),
                "informativeness": _clamp(row.get("helpfulness", 2.0) / 4.0),
                "complexity": _clamp(row.get("complexity", 2.0) / 4.0),
                "overall": _clamp(row.get("correctness", 2.0) / 4.0),
            })
    return rows


def unify_ultrafeedback(path: str):
    """Map UltraFeedback to unified 4-axis format.

    honesty→coherence, helpfulness→informativeness,
    truthfulness→overall.  complexity=None (UltraFeedback has no
    complexity proxy — instruction_following is semantically different).
    Scales: 1-5 → 0-1.
    """
    rows = []
    with open(path) as f:
        for line in f:
            row = json.loads(line)
            text = row.get("response", "") or row.get("text", "")
            if len(text.strip()) < 20:
                continue

            record = {
                "text": text.strip(),
                "source": "ultrafeedback",
                "coherence": None,
                "informativeness": None,
                "complexity": None,  # No valid complexity proxy in UltraFeedback
                "overall": None,
            }

            # Map available axes (1-5 scale → 0-1)
            if "honesty" in row:
                record["coherence"] = _clamp((float(row["honesty"]) - 1.0) / 4.0)
            if "helpfulness" in row:
                record["informativeness"] = _clamp((float(row["helpfulness"]) - 1.0) / 4.0)
            # NOTE: instruction_following is NOT mapped to complexity.
            # It measures how well the response follows instructions,
            # not text complexity. Only HelpSteer2 has true complexity labels.
            if "truthfulness" in row:
                record["overall"] = _clamp((float(row["truthfulness"]) - 1.0) / 4.0)

            # Fallback: use overall_score for missing axes
            if "overall_score" in row:
                os_norm = _clamp((float(row["overall_score"]) - 1.0) / 4.0)
                if record["overall"] is None:
                    record["overall"] = os_norm
                # If we have zero per-axis scores, use overall as proxy
                if record["coherence"] is None and record["informativeness"] is None:
                    record["informativeness"] = os_norm

            # Skip if we have zero labels
            if all(record[ax] is None for ax in AXES):
                continue

            rows.append(record)
    return rows


def unify_oasst2(path: str):
    """Map oasst2 to unified 4-axis format.

    quality→overall, helpfulness→informativeness,
    rank(0=best, 3=worst)→coherence proxy.
    """
    rows = []
    with open(path) as f:
        for line in f:
            row = json.loads(line)
            text = row.get("text", "")
            if len(text.strip()) < 20:
                continue

            record = {
                "text": text.strip(),
                "source": "oasst2",
                "coherence": None,
                "informativeness": None,
                "complexity": None,
                "overall": None,
            }

            # quality (already 0-1 in some versions, or 0-3)
            if "quality" in row and row["quality"] is not None:
                q = float(row["quality"])
                if q > 1.0:
                    q = q / 3.0  # normalize 0-3 to 0-1
                record["overall"] = _clamp(q)

            # helpfulness (0-1 or 0-3)
            if "helpfulness" in row and row["helpfulness"] is not None:
                h = float(row["helpfulness"])
                if h > 1.0:
                    h = h / 3.0
                record["informativeness"] = _clamp(h)

            # rank: 0=best, 3=worst → invert to 0-1 (1=best)
            if "rank" in row and row["rank"] is not None:
                r = float(row["rank"])
                record["coherence"] = _clamp(1.0 - r / 3.0)

            if all(record[ax] is None for ax in AXES):
                continue

            rows.append(record)
    return rows


def create_combined_dataset():
    """Create unified combined_quality.jsonl from all 3 sources."""
    print("\n4. Creating unified combined dataset...")

    combined = []

    hs_path = os.path.join(DATA_DIR, "helpsteer2.jsonl")
    if os.path.exists(hs_path):
        rows = unify_helpsteer2(hs_path)
        print(f"  HelpSteer2: {len(rows)} rows (all 4 axes)")
        combined.extend(rows)

    uf_path = os.path.join(DATA_DIR, "ultrafeedback.jsonl")
    if os.path.exists(uf_path):
        rows = unify_ultrafeedback(uf_path)
        print(f"  UltraFeedback: {len(rows)} rows (partial axes)")
        combined.extend(rows)

    oa_path = os.path.join(DATA_DIR, "oasst2.jsonl")
    if os.path.exists(oa_path):
        rows = unify_oasst2(oa_path)
        print(f"  oasst2: {len(rows)} rows (partial axes)")
        combined.extend(rows)

    # Shuffle
    rng = random.Random(42)
    rng.shuffle(combined)

    # Write
    output_path = os.path.join(DATA_DIR, "combined_quality.jsonl")
    with open(output_path, "w") as f:
        for row in combined:
            f.write(json.dumps(row) + "\n")

    # Stats
    axis_counts = {ax: sum(1 for r in combined if r[ax] is not None) for ax in AXES}
    print(f"\n  Combined: {len(combined)} total rows")
    for ax, cnt in axis_counts.items():
        print(f"    {ax}: {cnt} labeled ({cnt * 100 // len(combined)}%)")
    print(f"  Saved to {output_path}")

    return output_path


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("Verifily — Download Training Data (Full)")
    print("=" * 60)

    os.makedirs(DATA_DIR, exist_ok=True)

    print("\n1. HelpSteer2 (multi-axis quality annotations)...")
    try:
        download_helpsteer2()
    except Exception as e:
        print(f"  ERROR: {e}")

    print("\n2. UltraFeedback (GPT-4 quality scores)...")
    try:
        download_ultrafeedback()
    except Exception as e:
        print(f"  ERROR: {e}")

    print("\n3. OpenAssistant/oasst2 (human rankings)...")
    try:
        download_oasst2()
    except Exception as e:
        print(f"  ERROR: {e}")

    # Create unified dataset
    try:
        create_combined_dataset()
    except Exception as e:
        print(f"  ERROR creating combined dataset: {e}")

    # Summary
    print("\n" + "=" * 60)
    print("Summary:")
    for fname in ["helpsteer2.jsonl", "ultrafeedback.jsonl", "oasst2.jsonl", "combined_quality.jsonl"]:
        fpath = os.path.join(DATA_DIR, fname)
        if os.path.exists(fpath):
            with open(fpath) as f:
                lines = sum(1 for _ in f)
            size_mb = os.path.getsize(fpath) / (1024 * 1024)
            print(f"  {fname}: {lines} rows, {size_mb:.1f} MB")
        else:
            print(f"  {fname}: NOT DOWNLOADED")
    print("=" * 60)


if __name__ == "__main__":
    main()
