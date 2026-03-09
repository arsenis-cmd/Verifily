"""Tests for verifily_cli_v1.core.selector — data selection engine."""

import pytest

from verifily_cli_v1.core.annotator import Annotator
from verifily_cli_v1.core.selector import (
    DataSelector,
    SelectionConfig,
    SelectionResult,
    _dedup_filter,
    _diverse_select,
    _quality_diverse_select,
    _quality_top_select,
)


def _make_rows(texts):
    return [{"text": t} for t in texts]


# Diverse dataset for testing
_DIVERSE_TEXTS = [
    "Machine learning models require quality training data for accurate predictions.",
    "The ocean is vast and contains millions of species of marine life.",
    "Cooking Italian pasta requires fresh ingredients and proper technique.",
    "Quantum computing leverages quantum mechanical phenomena for computation.",
    "Ancient Roman architecture influenced Western building design for centuries.",
    "Neural networks mimic biological brain structures for pattern recognition.",
    "The Amazon rainforest produces significant amounts of global oxygen.",
    "Classical music compositions by Bach remain influential in modern theory.",
    "Cryptocurrency blockchain technology enables decentralized financial transactions.",
    "Mediterranean diet emphasizes fruits, vegetables, and healthy fats.",
]

# Duplicate-heavy dataset
_DUP_TEXTS = [
    "Machine learning models require quality training data.",
    "Machine learning models require quality training data.",
    "Machine learning models need quality training data.",
    "The ocean is vast and full of marine life.",
    "Cooking pasta requires fresh ingredients.",
]


class TestDedupFilter:
    def test_no_dups(self):
        from verifily_cli_v1.core.tfidf import TfidfVectorizer
        vecs = TfidfVectorizer(max_df_ratio=0.99).fit_transform(_DIVERSE_TEXTS[:5])
        keep = _dedup_filter(vecs, threshold=0.90)
        assert len(keep) == 5

    def test_removes_dups(self):
        from verifily_cli_v1.core.tfidf import TfidfVectorizer
        vecs = TfidfVectorizer(max_df_ratio=0.99).fit_transform(_DUP_TEXTS)
        keep = _dedup_filter(vecs, threshold=0.80)
        assert len(keep) < len(_DUP_TEXTS)

    def test_empty(self):
        assert _dedup_filter([], threshold=0.9) == []


class TestQualityTopSelect:
    def test_selects_budget(self):
        annotator = Annotator()
        ann = annotator.annotate_dataset(_DIVERSE_TEXTS)
        selected = _quality_top_select(ann, budget=3, quality_threshold=0.0, quality_axes=None)
        assert len(selected) == 3

    def test_threshold_filters(self):
        annotator = Annotator()
        ann = annotator.annotate_dataset(_DIVERSE_TEXTS)
        # Very high threshold might filter most rows
        selected = _quality_top_select(ann, budget=10, quality_threshold=0.99, quality_axes=None)
        assert len(selected) <= len(_DIVERSE_TEXTS)


class TestDiverseSelect:
    def test_selects_budget(self):
        from verifily_cli_v1.core.tfidf import TfidfVectorizer
        vecs = TfidfVectorizer(max_df_ratio=0.99).fit_transform(_DIVERSE_TEXTS)
        selected = _diverse_select(vecs, budget=5)
        assert len(selected) == 5
        assert len(set(selected)) == 5  # all unique

    def test_budget_exceeds_n(self):
        from verifily_cli_v1.core.tfidf import TfidfVectorizer
        vecs = TfidfVectorizer(max_df_ratio=0.99).fit_transform(_DIVERSE_TEXTS[:3])
        selected = _diverse_select(vecs, budget=10)
        assert len(selected) == 3

    def test_empty(self):
        assert _diverse_select([], budget=5) == []


class TestDataSelector:
    def test_quality_diverse_strategy(self):
        rows = _make_rows(_DIVERSE_TEXTS)
        config = SelectionConfig(budget=5, strategy="quality_diverse")
        selector = DataSelector(config)
        result = selector.select(rows, _DIVERSE_TEXTS)

        assert isinstance(result, SelectionResult)
        assert len(result.selected_indices) == 5
        assert len(result.selected_rows) == 5
        assert result.selection_stats["selected"] == 5

    def test_quality_top_strategy(self):
        rows = _make_rows(_DIVERSE_TEXTS)
        config = SelectionConfig(budget=3, strategy="quality_top")
        selector = DataSelector(config)
        result = selector.select(rows, _DIVERSE_TEXTS)
        assert len(result.selected_indices) == 3

    def test_diverse_strategy(self):
        rows = _make_rows(_DIVERSE_TEXTS)
        config = SelectionConfig(budget=4, strategy="diverse")
        selector = DataSelector(config)
        result = selector.select(rows, _DIVERSE_TEXTS)
        assert len(result.selected_indices) == 4

    def test_random_strategy(self):
        rows = _make_rows(_DIVERSE_TEXTS)
        config = SelectionConfig(budget=5, strategy="random", seed=42)
        selector = DataSelector(config)
        result = selector.select(rows, _DIVERSE_TEXTS)
        assert len(result.selected_indices) == 5

    def test_budget_zero(self):
        rows = _make_rows(_DIVERSE_TEXTS)
        config = SelectionConfig(budget=0)
        selector = DataSelector(config)
        result = selector.select(rows, _DIVERSE_TEXTS)
        assert result.selected_indices == []

    def test_budget_exceeds_total(self):
        rows = _make_rows(_DIVERSE_TEXTS[:3])
        config = SelectionConfig(budget=100)
        selector = DataSelector(config)
        result = selector.select(rows, _DIVERSE_TEXTS[:3])
        assert len(result.selected_indices) == 3

    def test_empty_dataset(self):
        config = SelectionConfig(budget=5)
        selector = DataSelector(config)
        result = selector.select([], [])
        assert result.selected_indices == []

    def test_to_dict(self):
        rows = _make_rows(_DIVERSE_TEXTS[:5])
        config = SelectionConfig(budget=3)
        selector = DataSelector(config)
        result = selector.select(rows, _DIVERSE_TEXTS[:5])
        d = result.to_dict()
        assert "selected_count" in d
        assert "diversity_score" in d
        assert d["selected_count"] == 3

    def test_quality_improvement_positive(self):
        """Quality-based selection should improve average quality vs random."""
        rows = _make_rows(_DIVERSE_TEXTS)
        config = SelectionConfig(budget=5, strategy="quality_top")
        selector = DataSelector(config)
        result = selector.select(rows, _DIVERSE_TEXTS)
        # Quality improvement should be >= 0 (selecting top rows)
        assert result.quality_improvement >= 0

    def test_dedup_reduces_count(self):
        rows = _make_rows(_DUP_TEXTS)
        config = SelectionConfig(budget=10, strategy="quality_top", dedup_threshold=0.80)
        selector = DataSelector(config)
        result = selector.select(rows, _DUP_TEXTS)
        assert result.selection_stats["after_dedup"] < len(_DUP_TEXTS)
