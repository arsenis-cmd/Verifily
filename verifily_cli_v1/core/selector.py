"""Data selection engine for Verifily.

Selects optimal training data subsets from a larger pool using
quality-weighted, diversity-maximized, dedup-aware strategies.
Uses dense sentence-transformer embeddings when available, falls
back to TF-IDF sparse vectors.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from verifily_cli_v1.core.annotator import (
    Annotator,
    DatasetAnnotation,
    RowAnnotation,
    _AXES,
)
from verifily_cli_v1.core.tfidf import (
    SparseVector,
    TfidfVectorizer,
    cosine_similarity,
    pairwise_cosine,
)
from verifily_cli_v1.core.topic_cluster import (
    auto_k,
    kmeans_sparse,
    topic_diversity_score,
    extract_topics,
)


# ---------------------------------------------------------------------------
# Config and result types
# ---------------------------------------------------------------------------

@dataclass
class SelectionConfig:
    """Configuration for data selection."""
    budget: int
    strategy: str = "quality_diverse"
    quality_axes: Optional[List[str]] = None
    quality_threshold: float = 0.0
    diversity_weight: float = 0.3
    dedup_threshold: float = 0.85
    seed: int = 42


@dataclass
class SelectionResult:
    """Result of data selection."""
    selected_indices: List[int]
    selected_rows: List[Dict]
    selection_stats: Dict[str, Any]
    diversity_score: float
    quality_improvement: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "selected_count": len(self.selected_indices),
            "selection_stats": self.selection_stats,
            "diversity_score": round(self.diversity_score, 4),
            "quality_improvement": round(self.quality_improvement, 4),
        }


# ---------------------------------------------------------------------------
# Quality scoring helpers
# ---------------------------------------------------------------------------

def _row_quality(ann: RowAnnotation, axes: Optional[List[str]] = None) -> float:
    """Compute average quality for a row across specified axes."""
    if axes:
        values = [getattr(ann, ax) for ax in axes if hasattr(ann, ax)]
    else:
        values = [
            ann.coherence, ann.informativeness, ann.complexity,
            ann.safety, ann.formatting, ann.uniqueness,
        ]
    return sum(values) / len(values) if values else 0.0


# ---------------------------------------------------------------------------
# Selection strategies
# ---------------------------------------------------------------------------

def _dedup_filter(
    tfidf_vecs: List[SparseVector],
    threshold: float,
) -> List[int]:
    """Remove near-duplicates, keeping the first occurrence.

    Returns indices of rows to keep.
    """
    n = len(tfidf_vecs)
    if n == 0:
        return []

    pairs = pairwise_cosine(tfidf_vecs, threshold=threshold)

    # Build set of indices to remove (keep the earlier one in each pair)
    remove = set()
    for i, j, sim in pairs:
        if j not in remove:
            remove.add(j)

    return [i for i in range(n) if i not in remove]


# ---------------------------------------------------------------------------
# Dense embedding helpers (sentence-transformers)
# ---------------------------------------------------------------------------

def _dense_cosine(a: List[float], b: List[float]) -> float:
    """Cosine similarity between two L2-normalized dense vectors."""
    return sum(x * y for x, y in zip(a, b))


def _dedup_filter_dense(
    embeddings: List[List[float]],
    threshold: float,
) -> List[int]:
    """Remove near-duplicates using dense embeddings, keeping first occurrence."""
    n = len(embeddings)
    if n == 0:
        return []

    remove: set = set()
    for i in range(n):
        if i in remove:
            continue
        for j in range(i + 1, n):
            if j in remove:
                continue
            sim = _dense_cosine(embeddings[i], embeddings[j])
            if sim >= threshold:
                remove.add(j)

    return [i for i in range(n) if i not in remove]


def _diverse_select_dense(
    embeddings: List[List[float]],
    budget: int,
    seed: int = 42,
) -> List[int]:
    """Select diverse rows via farthest-point sampling on dense embeddings."""
    n = len(embeddings)
    if n == 0 or budget <= 0:
        return []
    if budget >= n:
        return list(range(n))

    rng = random.Random(seed)
    selected = [rng.randint(0, n - 1)]
    remaining = set(range(n)) - set(selected)

    while len(selected) < budget and remaining:
        best_idx = -1
        best_min_dist = -1.0

        for idx in remaining:
            min_dist = min(
                1.0 - _dense_cosine(embeddings[idx], embeddings[s])
                for s in selected
            )
            if min_dist > best_min_dist:
                best_min_dist = min_dist
                best_idx = idx

        if best_idx < 0:
            break

        selected.append(best_idx)
        remaining.discard(best_idx)

    return selected


def _quality_diverse_select_dense(
    annotations: DatasetAnnotation,
    embeddings: List[List[float]],
    budget: int,
    diversity_weight: float,
    quality_threshold: float,
    quality_axes: Optional[List[str]],
    seed: int = 42,
) -> List[int]:
    """MMR variant using dense embeddings for diversity."""
    n = len(annotations.rows)
    if n == 0 or budget <= 0:
        return []
    if budget >= n:
        return list(range(n))

    lam = diversity_weight

    qualities = [_row_quality(ann, quality_axes) for ann in annotations.rows]
    eligible = [i for i in range(n) if qualities[i] >= quality_threshold]
    if not eligible:
        return []
    if budget >= len(eligible):
        return eligible

    start = max(eligible, key=lambda i: qualities[i])
    selected = [start]
    remaining = set(eligible) - {start}

    while len(selected) < budget and remaining:
        best_idx = -1
        best_score = -1.0

        for idx in remaining:
            q = qualities[idx]
            min_sim = min(
                _dense_cosine(embeddings[idx], embeddings[s])
                for s in selected
            )
            diversity = 1.0 - min_sim
            combined = (1 - lam) * q + lam * diversity
            if combined > best_score:
                best_score = combined
                best_idx = idx

        if best_idx < 0:
            break

        selected.append(best_idx)
        remaining.discard(best_idx)

    return selected


def _quality_top_select(
    annotations: DatasetAnnotation,
    budget: int,
    quality_threshold: float,
    quality_axes: Optional[List[str]],
) -> List[int]:
    """Select top-K rows by average quality score."""
    scored = []
    for i, ann in enumerate(annotations.rows):
        q = _row_quality(ann, quality_axes)
        if q >= quality_threshold:
            scored.append((i, q))

    scored.sort(key=lambda x: -x[1])
    return [idx for idx, _ in scored[:budget]]


def _diverse_select(
    tfidf_vecs: List[SparseVector],
    budget: int,
    seed: int = 42,
) -> List[int]:
    """Select diverse rows via farthest-point sampling on TF-IDF vectors."""
    n = len(tfidf_vecs)
    if n == 0 or budget <= 0:
        return []
    if budget >= n:
        return list(range(n))

    rng = random.Random(seed)
    selected = [rng.randint(0, n - 1)]
    remaining = set(range(n)) - set(selected)

    while len(selected) < budget and remaining:
        best_idx = -1
        best_min_dist = -1.0

        for idx in remaining:
            if not tfidf_vecs[idx]:
                continue
            # Min distance to any selected point
            min_dist = min(
                1.0 - cosine_similarity(tfidf_vecs[idx], tfidf_vecs[s])
                for s in selected
                if tfidf_vecs[s]
            ) if any(tfidf_vecs[s] for s in selected) else 1.0

            if min_dist > best_min_dist:
                best_min_dist = min_dist
                best_idx = idx

        if best_idx < 0:
            break

        selected.append(best_idx)
        remaining.discard(best_idx)

    return selected


def _quality_diverse_select(
    annotations: DatasetAnnotation,
    tfidf_vecs: List[SparseVector],
    budget: int,
    diversity_weight: float,
    quality_threshold: float,
    quality_axes: Optional[List[str]],
    seed: int = 42,
) -> List[int]:
    """Maximal Marginal Relevance (MMR) variant.

    score(i) = (1 - λ) * quality(i) + λ * min_distance(i, selected)

    Greedy selection until budget reached.
    """
    n = len(annotations.rows)
    if n == 0 or budget <= 0:
        return []
    if budget >= n:
        return list(range(n))

    lam = diversity_weight

    # Pre-compute quality scores
    qualities = []
    for ann in annotations.rows:
        q = _row_quality(ann, quality_axes)
        qualities.append(q)

    # Filter by threshold
    eligible = [i for i in range(n) if qualities[i] >= quality_threshold]
    if not eligible:
        return []

    if budget >= len(eligible):
        return eligible

    # Start with highest quality row
    rng = random.Random(seed)
    start = max(eligible, key=lambda i: qualities[i])
    selected = [start]
    remaining = set(eligible) - {start}

    while len(selected) < budget and remaining:
        best_idx = -1
        best_score = -1.0

        for idx in remaining:
            # Quality component
            q = qualities[idx]

            # Diversity component: min distance to selected
            if tfidf_vecs[idx] and any(tfidf_vecs[s] for s in selected):
                min_sim = min(
                    cosine_similarity(tfidf_vecs[idx], tfidf_vecs[s])
                    for s in selected
                    if tfidf_vecs[s]
                )
                diversity = 1.0 - min_sim
            else:
                diversity = 0.5

            combined = (1 - lam) * q + lam * diversity

            if combined > best_score:
                best_score = combined
                best_idx = idx

        if best_idx < 0:
            break

        selected.append(best_idx)
        remaining.discard(best_idx)

    return selected


# ---------------------------------------------------------------------------
# DataSelector
# ---------------------------------------------------------------------------

class DataSelector:
    """Selects optimal data subsets for training."""

    def __init__(self, config: SelectionConfig):
        self.config = config

    def select(
        self,
        rows: List[Dict],
        texts: List[str],
        annotations: Optional[DatasetAnnotation] = None,
    ) -> SelectionResult:
        """Select optimal subset.

        Args:
            rows: Raw row dicts.
            texts: Extracted text content per row.
            annotations: Pre-computed annotations (computed if None).
        """
        if not rows:
            return SelectionResult(
                selected_indices=[],
                selected_rows=[],
                selection_stats={},
                diversity_score=0.0,
                quality_improvement=0.0,
            )

        budget = min(self.config.budget, len(rows))
        if budget <= 0:
            return SelectionResult(
                selected_indices=[],
                selected_rows=[],
                selection_stats={"reason": "budget=0"},
                diversity_score=0.0,
                quality_improvement=0.0,
            )

        # Compute annotations if not provided
        if annotations is None:
            annotator = Annotator()
            annotations = annotator.annotate_dataset(texts)

        # Try dense embeddings first (sentence-transformers)
        dense_embeddings: Optional[List[List[float]]] = None
        try:
            from verifily_cli_v1.core.ml_backends import get_ml_backends, ml_available
            if ml_available():
                ml = get_ml_backends()
                dense_embeddings = ml.embed_sentences(texts)
        except Exception:
            pass

        # Compute TF-IDF vectors (always needed for diversity scoring)
        vectorizer = TfidfVectorizer(max_features=5000, max_df_ratio=0.98)
        tfidf_vecs = vectorizer.fit_transform(texts)

        # Dedup filter — prefer dense embeddings
        if self.config.dedup_threshold < 1.0:
            if dense_embeddings is not None:
                keep_indices = _dedup_filter_dense(
                    dense_embeddings, self.config.dedup_threshold,
                )
            else:
                keep_indices = _dedup_filter(tfidf_vecs, self.config.dedup_threshold)
        else:
            keep_indices = list(range(len(rows)))

        # Build filtered views
        filt_annotations = DatasetAnnotation(
            rows=[annotations.rows[i] for i in keep_indices],
            axis_summaries=annotations.axis_summaries,
            quality_matrix=[annotations.quality_matrix[i] for i in keep_indices],
            overall_profile=annotations.overall_profile,
        )
        filt_vecs = [tfidf_vecs[i] for i in keep_indices]
        filt_dense = (
            [dense_embeddings[i] for i in keep_indices]
            if dense_embeddings is not None
            else None
        )
        filt_budget = min(budget, len(keep_indices))

        # Select based on strategy — prefer dense when available
        strategy = self.config.strategy
        if strategy == "quality_top":
            filt_selected = _quality_top_select(
                filt_annotations, filt_budget,
                self.config.quality_threshold, self.config.quality_axes,
            )
        elif strategy == "diverse":
            if filt_dense is not None:
                filt_selected = _diverse_select_dense(
                    filt_dense, filt_budget, self.config.seed,
                )
            else:
                filt_selected = _diverse_select(
                    filt_vecs, filt_budget, self.config.seed,
                )
        elif strategy == "random":
            rng = random.Random(self.config.seed)
            filt_selected = rng.sample(range(len(keep_indices)), filt_budget)
        else:  # quality_diverse (default)
            if filt_dense is not None:
                filt_selected = _quality_diverse_select_dense(
                    filt_annotations, filt_dense, filt_budget,
                    self.config.diversity_weight, self.config.quality_threshold,
                    self.config.quality_axes, self.config.seed,
                )
            else:
                filt_selected = _quality_diverse_select(
                    filt_annotations, filt_vecs, filt_budget,
                    self.config.diversity_weight, self.config.quality_threshold,
                    self.config.quality_axes, self.config.seed,
                )

        # Map back to original indices
        selected_indices = [keep_indices[i] for i in filt_selected]

        # Compute stats
        all_qualities = [
            _row_quality(annotations.rows[i], self.config.quality_axes)
            for i in range(len(rows))
        ]
        sel_qualities = [
            _row_quality(annotations.rows[i], self.config.quality_axes)
            for i in selected_indices
        ]

        avg_all = sum(all_qualities) / len(all_qualities) if all_qualities else 0
        avg_sel = sum(sel_qualities) / len(sel_qualities) if sel_qualities else 0

        # Diversity score
        sel_vecs = [tfidf_vecs[i] for i in selected_indices]
        if len(sel_vecs) >= 2:
            k = min(auto_k(len(sel_vecs)), len(sel_vecs))
            assignments, centroids = kmeans_sparse(sel_vecs, k=k, seed=self.config.seed)
            topics = extract_topics(sel_vecs, assignments, centroids)
            div_score = topic_diversity_score(topics)
        else:
            div_score = 0.0

        return SelectionResult(
            selected_indices=selected_indices,
            selected_rows=[rows[i] for i in selected_indices],
            selection_stats={
                "total_rows": len(rows),
                "after_dedup": len(keep_indices),
                "selected": len(selected_indices),
                "strategy": strategy,
                "avg_quality_before": round(avg_all, 4),
                "avg_quality_after": round(avg_sel, 4),
            },
            diversity_score=div_score,
            quality_improvement=round(avg_sel - avg_all, 4),
        )
