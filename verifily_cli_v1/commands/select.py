"""CLI command for data selection."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional


def run_select(
    input_path: str,
    budget: int,
    output: Optional[str] = None,
    strategy: str = "quality_diverse",
    diversity_weight: float = 0.3,
    quality_threshold: float = 0.0,
    dedup_threshold: float = 0.85,
    seed: int = 42,
) -> Dict[str, Any]:
    """Run data selection on a dataset."""
    from verifily_cli_v1.core.readers import read_dataset
    from verifily_cli_v1.core.selector import DataSelector, SelectionConfig

    rows = read_dataset(input_path).rows

    _CONTENT_KEYS = {
        "input", "output", "instruction", "response", "question",
        "answer", "text", "content", "prompt", "completion",
    }

    def _extract(row):
        parts = []
        for key in _CONTENT_KEYS:
            val = row.get(key)
            if val and isinstance(val, str):
                parts.append(val)
        return " ".join(parts) if parts else str(row)

    texts = [_extract(row) for row in rows]

    config = SelectionConfig(
        budget=budget,
        strategy=strategy,
        diversity_weight=diversity_weight,
        quality_threshold=quality_threshold,
        dedup_threshold=dedup_threshold,
        seed=seed,
    )

    selector = DataSelector(config)
    result = selector.select(rows, texts)

    # Write output
    if output:
        out_path = Path(output)
        with open(out_path, "w") as f:
            for row in result.selected_rows:
                f.write(json.dumps(row) + "\n")

    return result.to_dict()
