"""CLI command for multi-axis quality annotation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional


def run_annotate(
    input_path: str,
    output: Optional[str] = None,
    axes: Optional[str] = None,
    min_score: float = 0.0,
    json_output: bool = False,
) -> Dict[str, Any]:
    """Run multi-axis quality annotation on a dataset."""
    from verifily_cli_v1.core.annotator import Annotator
    from verifily_cli_v1.core.io import read_jsonl
    from verifily_cli_v1.core.readers import read_dataset

    rows = read_dataset(input_path).rows

    # Extract text
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

    # Parse axes
    axis_list = axes.split(",") if axes else None
    annotator = Annotator(axes=axis_list)
    annotation = annotator.annotate_dataset(texts)

    # Filter by min_score
    if min_score > 0:
        keep = []
        for i, ann in enumerate(annotation.rows):
            if ann.mean_score() >= min_score:
                keep.append(i)
        filtered_count = len(rows) - len(keep)
    else:
        keep = list(range(len(rows)))
        filtered_count = 0

    result = {
        "total_rows": len(rows),
        "annotated": len(keep),
        "filtered": filtered_count,
        "overall_profile": annotation.overall_profile,
        "axis_summaries": {
            k: v.to_dict() for k, v in annotation.axis_summaries.items()
        },
    }

    # Write output
    if output:
        out_path = Path(output)
        with open(out_path, "w") as f:
            for i in keep:
                entry = {
                    **rows[i],
                    "_annotations": annotation.rows[i].to_dict(),
                }
                f.write(json.dumps(entry) + "\n")

    return result
