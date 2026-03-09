"""Dataset versioning and comparison for Verifily.

Computes structural and semantic diffs between two dataset versions.
Tracks quality metric evolution, detects distribution changes,
and identifies new/lost topics.

When ML available, uses sentence-transformer embeddings for
semantic similarity, dense centroid drift, and K-means topic comparison.
"""

from __future__ import annotations

import hashlib
import math
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple

from verifily_cli_v1.core.hashing import sha256_string
from verifily_cli_v1.core.stat_tests import (
    StatTestResult,
    chi_squared_test,
    classifier_drift_test,
    embedding_centroid_shift_dense,
    ks_test,
    vocabulary_drift,
    vocabulary_drift_dense,
)
from verifily_cli_v1.core.tfidf import TfidfVectorizer, tokenize
from verifily_cli_v1.core.topic_cluster import (
    auto_k,
    extract_topics,
    kmeans_sparse,
)


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class DatasetDiff:
    """Structural and semantic diff between two dataset versions."""
    added_count: int
    removed_count: int
    modified_count: int
    unchanged_count: int
    overlap_ratio: float
    quality_delta: Dict[str, float]
    distribution_changes: List[StatTestResult]
    new_topics: List[str]
    lost_topics: List[str]
    sample_added: List[Dict]
    sample_removed: List[Dict]
    semantic_similarity: Optional[float] = None  # Dense embedding cosine (0-1)

    def to_dict(self) -> Dict[str, Any]:
        d = {
            "added_count": self.added_count,
            "removed_count": self.removed_count,
            "modified_count": self.modified_count,
            "unchanged_count": self.unchanged_count,
            "overlap_ratio": round(self.overlap_ratio, 4),
            "quality_delta": {
                k: round(v, 4) for k, v in self.quality_delta.items()
            },
            "distribution_changes": [
                r.to_dict() for r in self.distribution_changes
            ],
            "new_topics": self.new_topics,
            "lost_topics": self.lost_topics,
        }
        if self.semantic_similarity is not None:
            d["semantic_similarity"] = round(self.semantic_similarity, 4)
        return d


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------

_CONTENT_KEYS = {
    "input", "output", "instruction", "response", "question", "answer",
    "text", "content", "prompt", "completion", "message",
}


def _extract_text(row: Dict) -> str:
    """Extract text content from a row dict."""
    parts = []
    for key in _CONTENT_KEYS:
        val = row.get(key)
        if val and isinstance(val, str):
            parts.append(val)
    if not parts:
        # Fallback: concatenate all string values
        for val in row.values():
            if isinstance(val, str):
                parts.append(val)
    return " ".join(parts)


def _row_fingerprint(row: Dict) -> str:
    """Content-based fingerprint for matching rows across versions."""
    text = _extract_text(row).strip().lower()
    return sha256_string(text)


# ---------------------------------------------------------------------------
# Core diff
# ---------------------------------------------------------------------------

def diff_datasets(
    dataset_a: List[Dict],
    dataset_b: List[Dict],
    *,
    deep_compare: bool = True,
    max_samples: int = 5,
) -> DatasetDiff:
    """Compute structural and semantic diff between two dataset versions.

    Args:
        dataset_a: First (older) dataset version.
        dataset_b: Second (newer) dataset version.
        deep_compare: Run quality + distribution analysis.
        max_samples: Max sample rows for added/removed.
    """
    if not dataset_a and not dataset_b:
        return DatasetDiff(
            added_count=0, removed_count=0, modified_count=0,
            unchanged_count=0, overlap_ratio=1.0,
            quality_delta={}, distribution_changes=[],
            new_topics=[], lost_topics=[],
            sample_added=[], sample_removed=[],
        )

    # Fingerprint all rows
    fp_a = {}  # fingerprint -> (index, row)
    for i, row in enumerate(dataset_a):
        fp = _row_fingerprint(row)
        fp_a[fp] = (i, row)

    fp_b = {}
    for i, row in enumerate(dataset_b):
        fp = _row_fingerprint(row)
        fp_b[fp] = (i, row)

    set_a = set(fp_a.keys())
    set_b = set(fp_b.keys())

    unchanged_fps = set_a & set_b
    removed_fps = set_a - set_b
    added_fps = set_b - set_a

    unchanged_count = len(unchanged_fps)
    removed_count = len(removed_fps)
    added_count = len(added_fps)

    total = max(1, len(set_a | set_b))
    overlap_ratio = unchanged_count / total

    # Sample added/removed
    sample_added = [fp_b[fp][1] for fp in list(added_fps)[:max_samples]]
    sample_removed = [fp_a[fp][1] for fp in list(removed_fps)[:max_samples]]

    quality_delta: Dict[str, float] = {}
    distribution_changes: List[StatTestResult] = []
    new_topics: List[str] = []
    lost_topics: List[str] = []
    semantic_similarity: Optional[float] = None

    if deep_compare and dataset_a and dataset_b:
        texts_a = [_extract_text(row) for row in dataset_a]
        texts_b = [_extract_text(row) for row in dataset_b]

        # Quality comparison
        try:
            from verifily_cli_v1.core.quality import analyze_quality
            report_a = analyze_quality(dataset_a)
            report_b = analyze_quality(dataset_b)
            quality_delta["quality_score"] = (
                report_b.quality_score - report_a.quality_score
            )
            # Compare stats
            for key in ["type_token_ratio", "hapax_ratio"]:
                val_a = report_a.stats.get(key, 0)
                val_b = report_b.stats.get(key, 0)
                if isinstance(val_a, (int, float)) and isinstance(val_b, (int, float)):
                    quality_delta[key] = val_b - val_a
        except Exception:
            pass

        # Annotation comparison
        try:
            from verifily_cli_v1.core.annotator import Annotator
            annotator = Annotator()
            ann_a = annotator.annotate_dataset(texts_a)
            ann_b = annotator.annotate_dataset(texts_b)
            for axis in ann_a.overall_profile:
                val_a = ann_a.overall_profile.get(axis, 0)
                val_b = ann_b.overall_profile.get(axis, 0)
                quality_delta[f"axis_{axis}"] = val_b - val_a
        except Exception:
            pass

        # Length distribution comparison
        lens_a = [len(t.split()) for t in texts_a]
        lens_b = [len(t.split()) for t in texts_b]
        if lens_a and lens_b:
            distribution_changes.append(
                ks_test(
                    [float(x) for x in lens_a],
                    [float(x) for x in lens_b],
                    feature_name="length_distribution",
                )
            )

        # Vocabulary drift (TF-IDF baseline)
        if texts_a and texts_b:
            distribution_changes.append(
                vocabulary_drift(texts_a, texts_b, feature_name="vocabulary")
            )

        # Dense embedding drift (sentence-transformers, if available)
        semantic_similarity = None
        if texts_a and texts_b:
            dense_shift = embedding_centroid_shift_dense(
                texts_a, texts_b, feature_name="semantic_dense",
            )
            if dense_shift is not None:
                distribution_changes.append(dense_shift)
                semantic_similarity = 1.0 - dense_shift.statistic

            dense_vocab = vocabulary_drift_dense(
                texts_a, texts_b, feature_name="vocabulary_dense",
            )
            if dense_vocab is not None:
                distribution_changes.append(dense_vocab)

            # Classifier Two-Sample Test (trained ML drift detector)
            c2st = classifier_drift_test(
                texts_a, texts_b, feature_name="classifier_c2st",
            )
            if c2st is not None:
                distribution_changes.append(c2st)

        # Label/category distribution
        cat_a = _extract_categories(dataset_a)
        cat_b = _extract_categories(dataset_b)
        if cat_a and cat_b:
            distribution_changes.append(
                chi_squared_test(cat_a, cat_b, feature_name="category_distribution")
            )

        # Topic comparison (tries dense embeddings first, falls back to TF-IDF)
        new_topics, lost_topics = _compare_topics(texts_a, texts_b)

    return DatasetDiff(
        added_count=added_count,
        removed_count=removed_count,
        modified_count=0,  # Not applicable with fingerprint-based matching
        unchanged_count=unchanged_count,
        overlap_ratio=overlap_ratio,
        quality_delta=quality_delta,
        distribution_changes=distribution_changes,
        new_topics=new_topics,
        lost_topics=lost_topics,
        sample_added=sample_added,
        sample_removed=sample_removed,
        semantic_similarity=semantic_similarity,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_categories(rows: List[Dict]) -> Dict[str, int]:
    """Extract category/label distribution from rows."""
    counts: Dict[str, int] = {}
    for row in rows:
        for key in ["category", "label", "type", "tag"]:
            val = row.get(key)
            if val and isinstance(val, str):
                counts[val] = counts.get(val, 0) + 1
                break
    return counts


def _compare_topics_dense(
    texts_a: List[str],
    texts_b: List[str],
    max_docs: int = 500,
) -> Optional[Tuple[List[str], List[str]]]:
    """Compare topics using K-means on sentence-transformer embeddings.

    Returns (new_topics, lost_topics) or None if ML unavailable.
    """
    try:
        from verifily_cli_v1.core.ml_backends import get_ml_backends, ml_available
        if not ml_available():
            return None
        ml = get_ml_backends()
    except Exception:
        return None

    sample_a = texts_a[:max_docs]
    sample_b = texts_b[:max_docs]

    emb_a = ml.embed_sentences(sample_a)
    emb_b = ml.embed_sentences(sample_b)

    if emb_a is None or emb_b is None:
        return None

    import math

    def _kmeans_dense(embeddings, k, max_iter=20):
        """Simple K-means on dense vectors."""
        import random as _rng
        rng = _rng.Random(42)
        n = len(embeddings)
        dim = len(embeddings[0])

        # Init centroids randomly
        indices = rng.sample(range(n), min(k, n))
        centroids = [list(embeddings[i]) for i in indices]

        assignments = [0] * n
        for _ in range(max_iter):
            # Assign
            for i in range(n):
                best_c = 0
                best_sim = -1.0
                for c in range(len(centroids)):
                    sim = sum(a * b for a, b in zip(embeddings[i], centroids[c]))
                    if sim > best_sim:
                        best_sim = sim
                        best_c = c
                assignments[i] = best_c
            # Update centroids
            for c in range(len(centroids)):
                members = [i for i in range(n) if assignments[i] == c]
                if members:
                    centroid = [
                        sum(embeddings[m][d] for m in members) / len(members)
                        for d in range(dim)
                    ]
                    norm = math.sqrt(sum(x * x for x in centroid))
                    if norm > 0:
                        centroid = [x / norm for x in centroid]
                    centroids[c] = centroid

        return assignments, centroids

    def _get_cluster_keywords(texts, assignments, k):
        """Extract top keywords per cluster."""
        from collections import Counter
        cluster_terms: Dict[int, Counter] = {c: Counter() for c in range(k)}
        for i, text in enumerate(texts):
            words = set(text.lower().split())
            cluster_terms[assignments[i]].update(words)
        all_terms: Set[str] = set()
        for c in range(k):
            for term, _ in cluster_terms[c].most_common(5):
                if len(term) > 2:
                    all_terms.add(term)
        return all_terms

    k_a = min(max(2, len(sample_a) // 20), 10)
    k_b = min(max(2, len(sample_b) // 20), 10)

    assign_a, _ = _kmeans_dense(emb_a, k_a)
    assign_b, _ = _kmeans_dense(emb_b, k_b)

    terms_a = _get_cluster_keywords(sample_a, assign_a, k_a)
    terms_b = _get_cluster_keywords(sample_b, assign_b, k_b)

    new_topics = sorted(terms_b - terms_a)[:10]
    lost_topics = sorted(terms_a - terms_b)[:10]

    return new_topics, lost_topics


def _compare_topics(
    texts_a: List[str],
    texts_b: List[str],
    max_docs: int = 2000,
) -> Tuple[List[str], List[str]]:
    """Compare topic coverage between two datasets.

    Tries dense embedding K-means first, falls back to TF-IDF K-means.
    Returns (new_topics, lost_topics) as lists of top terms.
    """
    # Try dense embeddings first
    dense_result = _compare_topics_dense(texts_a, texts_b)
    if dense_result is not None:
        return dense_result

    # Fall back to TF-IDF K-means
    try:
        all_texts = texts_a[:max_docs] + texts_b[:max_docs]
        vectorizer = TfidfVectorizer(max_features=3000, max_df_ratio=0.98)
        vectorizer.fit(all_texts)

        vecs_a = vectorizer.transform(texts_a[:max_docs])
        vecs_b = vectorizer.transform(texts_b[:max_docs])

        def _get_topic_terms(vecs):
            if len(vecs) < 3:
                return set()
            k = min(auto_k(len(vecs)), len(vecs))
            assignments, centroids = kmeans_sparse(vecs, k=k)
            topics = extract_topics(vecs, assignments, centroids, top_n=5)
            terms = set()
            for topic in topics:
                for term, _ in topic.get("top_terms", []):
                    terms.add(term)
            return terms

        topics_a = _get_topic_terms(vecs_a)
        topics_b = _get_topic_terms(vecs_b)

        new_topics = sorted(topics_b - topics_a)[:10]
        lost_topics = sorted(topics_a - topics_b)[:10]

        return new_topics, lost_topics
    except Exception:
        return [], []


def format_diff_report(diff: DatasetDiff) -> str:
    """Format a dataset diff as a text report."""
    lines = [
        "Dataset Diff Report",
        "=" * 50,
        f"Added:     {diff.added_count} rows",
        f"Removed:   {diff.removed_count} rows",
        f"Unchanged: {diff.unchanged_count} rows",
        f"Overlap:   {diff.overlap_ratio:.1%}",
        "",
    ]

    if diff.quality_delta:
        lines.append("Quality Changes:")
        for key, val in sorted(diff.quality_delta.items()):
            direction = "+" if val > 0 else ""
            lines.append(f"  {key}: {direction}{val:.4f}")
        lines.append("")

    if diff.distribution_changes:
        lines.append("Distribution Tests:")
        for test in diff.distribution_changes:
            status = "DRIFT" if test.drifted else "OK"
            lines.append(f"  [{status}] {test.feature_name}: {test.detail}")
        lines.append("")

    if diff.new_topics:
        lines.append(f"New Topics: {', '.join(diff.new_topics)}")
    if diff.lost_topics:
        lines.append(f"Lost Topics: {', '.join(diff.lost_topics)}")

    return "\n".join(lines)
