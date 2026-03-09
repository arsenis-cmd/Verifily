"""CLI command for quality prediction."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional


def run_predict(
    input_path: str,
    output: Optional[str] = None,
    what_if_remove: Optional[str] = None,
) -> Dict[str, Any]:
    """Run quality prediction on a dataset."""
    from verifily_cli_v1.core.annotator import Annotator
    from verifily_cli_v1.core.predictor import QualityPredictor
    from verifily_cli_v1.core.quality import analyze_quality
    from verifily_cli_v1.core.readers import read_dataset

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

    # Run analysis
    report = analyze_quality(rows)
    annotator = Annotator()
    annotation = annotator.annotate_dataset(texts)

    predictor = QualityPredictor()
    prediction = predictor.predict(report, annotation, len(rows))

    result = prediction.to_dict()

    # What-if analysis
    if what_if_remove:
        axis, threshold_str = what_if_remove.split(":")
        threshold = float(threshold_str)
        what_if_pred = predictor.what_if_remove(rows, texts, axis, threshold)
        result["what_if"] = {
            f"remove_{axis}_below_{threshold}": what_if_pred.to_dict()
        }

    # Write output
    if output:
        with open(Path(output), "w") as f:
            json.dump(result, f, indent=2)

    return result
