"""ML-based quality judge using the trained quality model.

Uses the fine-tuned deberta quality model to produce per-row
and aggregate quality scores via the "overall" axis.

Falls back to embedding-based heuristics if the quality model
is unavailable.

Optional dependency: requires ``torch`` + ``transformers``.

Usage::

    result = judge_quality(texts)
    if result:
        print(f"Model quality score: {result['model_quality_score']}")
"""

from __future__ import annotations

import math
import random
from typing import Any, Dict, List, Optional

from verifily_cli_v1.core.embeddings import _has_torch, _has_transformers


# ---------------------------------------------------------------------------
# Availability
# ---------------------------------------------------------------------------

def _has_model_judge() -> bool:
    """Check if full model judge dependencies are available."""
    return _has_torch() and _has_transformers()


# ---------------------------------------------------------------------------
# Quality Judge
# ---------------------------------------------------------------------------

class QualityJudge:
    """Quality judge using the trained deberta quality model.

    Primary mode: uses ml_backends.score_quality_axes() to get the
    "overall" quality score from the fine-tuned deberta model.

    Fallback mode: uses embedding-based scoring if the quality model
    is unavailable.
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        embedder_name: str = "distilbert-base-uncased",
        prefer_backend: str = "auto",
    ):
        self._model_path = model_path
        self._embedder_name = embedder_name
        self._prefer_backend = prefer_backend
        self._embedder = None
        self._ml = None  # ML backends for quality model
        self._head_weights: Optional[List[float]] = None
        self._head_bias: float = 0.0

    def _load(self) -> None:
        """Load quality model backend (preferred) or embedding fallback."""
        # Try to get ML backends for quality model scoring
        # Only use quality model when backend preference is "auto" (default)
        if self._prefer_backend == "auto":
            try:
                from verifily_cli_v1.core.ml_backends import get_ml_backends, ml_available
                if ml_available():
                    self._ml = get_ml_backends()
            except Exception:
                pass

        # Load embedder as fallback (or when explicit backend requested)
        if self._ml is None:
            from verifily_cli_v1.core.embeddings import get_embedder
            self._embedder = get_embedder(
                prefer=self._prefer_backend,
                model_name=self._embedder_name,
            )
            if self._model_path:
                self._load_head(self._model_path)

    def _load_head(self, path: str) -> None:
        """Load trained linear head weights from a file."""
        import json
        with open(path) as f:
            data = json.load(f)
        self._head_weights = data["weights"]
        self._head_bias = data.get("bias", 0.0)

    def _heuristic_score(self, embedding: List[float]) -> float:
        """Fallback: score based on embedding entropy (used only when quality model unavailable)."""
        if not embedding:
            return 0.0

        norm = math.sqrt(sum(x * x for x in embedding))
        if norm < 0.01:
            return 0.1

        abs_vals = [abs(x) for x in embedding]
        total = sum(abs_vals) or 1.0
        probs = [v / total for v in abs_vals if v > 0]
        entropy = -sum(p * math.log(p) for p in probs if p > 0)

        max_entropy = math.log(max(len(embedding), 1))
        normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0.0

        return max(0.0, min(1.0, normalized_entropy))

    def _linear_score(self, embedding: List[float]) -> float:
        """Fallback: score using trained linear head or heuristic."""
        if self._head_weights is None:
            return self._heuristic_score(embedding)

        z = sum(w * x for w, x in zip(self._head_weights, embedding))
        z += self._head_bias

        if z >= 0:
            return 1.0 / (1.0 + math.exp(-z))
        else:
            ez = math.exp(z)
            return ez / (1.0 + ez)

    def judge_rows(
        self,
        texts: List[str],
        batch_size: int = 32,
    ) -> List[float]:
        """Score individual rows for quality (0.0-1.0).

        Uses the trained deberta quality model's "overall" axis when
        available. Falls back to embedding-based scoring otherwise.
        """
        if self._ml is None and self._embedder is None:
            self._load()

        # Primary: use trained quality model
        if self._ml is not None:
            try:
                quality_axes = self._ml.score_quality_axes(texts)
                if quality_axes is not None and "overall" in quality_axes:
                    return [round(s, 4) for s in quality_axes["overall"]]
            except Exception:
                pass

        # Fallback: embedding-based scoring
        if self._embedder is None:
            from verifily_cli_v1.core.embeddings import get_embedder
            self._embedder = get_embedder(
                prefer=self._prefer_backend,
                model_name=self._embedder_name,
            )

        embeddings = self._embedder.embed(texts, batch_size=batch_size)
        return [round(self._linear_score(emb), 4) for emb in embeddings]

    def judge_dataset(
        self,
        texts: List[str],
        batch_size: int = 32,
    ) -> Dict[str, Any]:
        """Aggregate quality assessment for a dataset.

        Returns dict with:
            - model_quality_score: 0-100 aggregate score
            - per_row_mean: mean per-row score
            - low_quality_count: rows scoring < 0.3
            - high_quality_fraction: fraction scoring >= 0.7
            - model_backend: backend used for scoring
        """
        if self._ml is None and self._embedder is None:
            self._load()

        per_row = self.judge_rows(texts, batch_size=batch_size)

        backend = "quality_model" if self._ml is not None else (
            self._embedder.backend if self._embedder else "unknown"
        )

        if not per_row:
            return {
                "model_quality_score": 0,
                "per_row_mean": 0.0,
                "low_quality_count": 0,
                "high_quality_fraction": 0.0,
                "model_backend": backend,
            }

        mean_score = sum(per_row) / len(per_row)
        low_quality = [i for i, s in enumerate(per_row) if s < 0.3]
        high_quality = sum(1 for s in per_row if s >= 0.7)

        return {
            "model_quality_score": max(0, min(100, int(mean_score * 100))),
            "per_row_mean": round(mean_score, 4),
            "low_quality_count": len(low_quality),
            "high_quality_fraction": round(high_quality / len(per_row), 4),
            "model_backend": backend,
        }


# ---------------------------------------------------------------------------
# Convenience API
# ---------------------------------------------------------------------------

def judge_quality(
    texts: List[str],
    model_path: Optional[str] = None,
    prefer_backend: str = "auto",
) -> Optional[Dict[str, Any]]:
    """Convenience function for quality judging.

    Returns None if no suitable backend is available,
    otherwise returns a dict with quality assessment results.
    """
    try:
        judge = QualityJudge(
            model_path=model_path,
            prefer_backend=prefer_backend,
        )
        return judge.judge_dataset(texts)
    except Exception:
        return None
