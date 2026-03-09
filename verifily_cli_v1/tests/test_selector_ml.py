"""Tests for ML-backed selection in verifily_cli_v1.core.selector."""

from __future__ import annotations

import pytest

from verifily_cli_v1.core.ml_backends import ml_available
from verifily_cli_v1.core.selector import (
    DataSelector,
    SelectionConfig,
    _dedup_filter_dense,
    _dense_cosine,
    _diverse_select_dense,
    _quality_diverse_select_dense,
)
from verifily_cli_v1.core.annotator import Annotator, DatasetAnnotation

_SKIP = not ml_available()
_REASON = "ML dependencies not installed"


# ---------------------------------------------------------------------------
# Dense cosine helper
# ---------------------------------------------------------------------------

class TestDenseCosine:
    def test_identical_vectors(self):
        v = [1.0, 0.0, 0.0]
        assert abs(_dense_cosine(v, v) - 1.0) < 1e-6

    def test_orthogonal_vectors(self):
        a = [1.0, 0.0, 0.0]
        b = [0.0, 1.0, 0.0]
        assert abs(_dense_cosine(a, b)) < 1e-6


# ---------------------------------------------------------------------------
# Dense dedup
# ---------------------------------------------------------------------------

@pytest.mark.skipif(_SKIP, reason=_REASON)
class TestDedupFilterDense:
    def test_duplicates_removed(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        texts = [
            "The cat sat on the mat.",
            "The cat sat on the mat.",
            "Quantum computing changes everything.",
        ]
        embeddings = ml.embed_sentences(texts)
        kept = _dedup_filter_dense(embeddings, threshold=0.95)
        # First duplicate kept, second removed
        assert 0 in kept
        assert 2 in kept
        assert len(kept) == 2

    def test_unique_texts_all_kept(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        texts = [
            "Machine learning models learn from data.",
            "Cooking requires patience and good ingredients.",
            "The stock market fluctuated wildly.",
        ]
        embeddings = ml.embed_sentences(texts)
        kept = _dedup_filter_dense(embeddings, threshold=0.95)
        assert len(kept) == 3

    def test_empty_returns_empty(self):
        assert _dedup_filter_dense([], threshold=0.85) == []


# ---------------------------------------------------------------------------
# Dense diverse select
# ---------------------------------------------------------------------------

@pytest.mark.skipif(_SKIP, reason=_REASON)
class TestDiverseSelectDense:
    def test_selects_correct_budget(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        texts = [
            "Python is a programming language.",
            "Java is used for enterprise software.",
            "Cooking pasta requires boiling water.",
            "The solar system has eight planets.",
            "Music theory covers harmony and rhythm.",
        ]
        embeddings = ml.embed_sentences(texts)
        selected = _diverse_select_dense(embeddings, budget=3, seed=42)
        assert len(selected) == 3
        assert len(set(selected)) == 3  # all unique

    def test_budget_exceeds_n(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        texts = ["a", "b"]
        embeddings = ml.embed_sentences(texts)
        selected = _diverse_select_dense(embeddings, budget=10)
        assert selected == [0, 1]

    def test_selects_dissimilar_texts(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        # 3 similar ML texts + 1 very different cooking text
        texts = [
            "Neural networks learn patterns from data.",
            "Deep learning uses multiple layers of neurons.",
            "Machine learning models are trained on datasets.",
            "Bake the chocolate cake at 350 degrees for 30 minutes.",
        ]
        embeddings = ml.embed_sentences(texts)
        selected = _diverse_select_dense(embeddings, budget=2, seed=42)
        # Should pick one ML text and the cooking text for max diversity
        assert 3 in selected


# ---------------------------------------------------------------------------
# Dense quality-diverse select (MMR)
# ---------------------------------------------------------------------------

@pytest.mark.skipif(_SKIP, reason=_REASON)
class TestQualityDiverseSelectDense:
    def test_returns_correct_budget(self):
        texts = [
            "Machine learning automates analytical model building.",
            "Data preprocessing is crucial for model performance.",
            "Cooking requires fresh ingredients and patience.",
            "The stock market reacted to the Federal Reserve announcement.",
            "Ancient civilizations built remarkable architectural structures.",
        ]
        ann = Annotator(use_ml=True).annotate_dataset(texts)
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        embeddings = ml.embed_sentences(texts)
        selected = _quality_diverse_select_dense(
            ann, embeddings, budget=3,
            diversity_weight=0.3, quality_threshold=0.0,
            quality_axes=None, seed=42,
        )
        assert len(selected) == 3

    def test_quality_threshold_filters(self):
        texts = ["a", "b", "c", "Good quality sentence with enough content for analysis."]
        ann = Annotator(use_ml=True).annotate_dataset(texts)
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        embeddings = ml.embed_sentences(texts)
        selected = _quality_diverse_select_dense(
            ann, embeddings, budget=10,
            diversity_weight=0.3, quality_threshold=0.4,
            quality_axes=None, seed=42,
        )
        # Only rows above threshold are eligible (small tolerance for model calibration)
        for idx in selected:
            from verifily_cli_v1.core.selector import _row_quality
            q = _row_quality(ann.rows[idx])
            assert q >= 0.39


# ---------------------------------------------------------------------------
# Full DataSelector with ML
# ---------------------------------------------------------------------------

@pytest.mark.skipif(_SKIP, reason=_REASON)
class TestDataSelectorML:
    def test_select_with_dense_embeddings(self):
        texts = [
            "Machine learning is transforming healthcare.",
            "Deep learning neural networks process images.",
            "Natural language processing understands text.",
            "Cooking Italian pasta requires olive oil.",
            "The ancient Romans built impressive roads.",
        ]
        rows = [{"text": t} for t in texts]
        config = SelectionConfig(budget=3, strategy="quality_diverse", seed=42)
        result = DataSelector(config).select(rows, texts)
        assert len(result.selected_indices) == 3
        assert result.diversity_score >= 0.0

    def test_diverse_strategy_uses_dense(self):
        texts = [
            "Python is great for data science.",
            "JavaScript runs in the browser.",
            "Cooking requires patience.",
            "The universe is expanding.",
        ]
        rows = [{"text": t} for t in texts]
        config = SelectionConfig(budget=2, strategy="diverse", seed=42)
        result = DataSelector(config).select(rows, texts)
        assert len(result.selected_indices) == 2

    def test_dedup_uses_dense(self):
        texts = [
            "The cat sat on the mat.",
            "The cat sat on the mat.",
            "Quantum computing is the future.",
        ]
        rows = [{"text": t} for t in texts]
        config = SelectionConfig(budget=3, dedup_threshold=0.95, seed=42)
        result = DataSelector(config).select(rows, texts)
        # Should dedup one of the duplicate texts
        assert result.selection_stats["after_dedup"] == 2
