"""Tests for ML-backed annotation in verifily_cli_v1.core.annotator."""

from __future__ import annotations

import pytest

from verifily_cli_v1.core.ml_backends import ml_available
from verifily_cli_v1.core.annotator import (
    Annotator,
    _AXES,
    _score_coherence_ml,
    _score_safety_ml,
    _score_uniqueness_ml,
)

_SKIP = not ml_available()
_REASON = "ML dependencies not installed"


# ---------------------------------------------------------------------------
# ML coherence
# ---------------------------------------------------------------------------

@pytest.mark.skipif(_SKIP, reason=_REASON)
class TestCoherenceML:
    def test_single_sentence_returns_1(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        assert _score_coherence_ml("Just one sentence here.", ml) == 1.0

    def test_coherent_text_scores_high(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        text = (
            "Machine learning models learn patterns from data. "
            "Neural networks are a type of machine learning model. "
            "Deep learning uses multiple neural network layers."
        )
        score = _score_coherence_ml(text, ml)
        assert score > 0.5

    def test_incoherent_text_scores_lower(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        coherent = (
            "The dog chased the ball in the park. "
            "The dog then brought the ball back to its owner."
        )
        incoherent = (
            "The dog chased the ball in the park. "
            "Quantum computing leverages superposition for parallel processing."
        )
        score_c = _score_coherence_ml(coherent, ml)
        score_i = _score_coherence_ml(incoherent, ml)
        assert score_c > score_i

    def test_score_in_range(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        score = _score_coherence_ml("First sentence. Second sentence.", ml)
        assert 0.0 <= score <= 1.0


# ---------------------------------------------------------------------------
# ML safety
# ---------------------------------------------------------------------------

@pytest.mark.skipif(_SKIP, reason=_REASON)
class TestSafetyML:
    def test_clean_text_safe(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        score = _score_safety_ml("The weather is beautiful today.", ml)
        assert score > 0.7

    def test_toxic_text_lower_score(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        score = _score_safety_ml("You are an absolute idiot and I hate you.", ml)
        assert score < 0.5

    def test_pii_still_penalized(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        score = _score_safety_ml(
            "Contact me at john@example.com or 555-123-4567.", ml
        )
        assert score < 1.0


# ---------------------------------------------------------------------------
# ML uniqueness
# ---------------------------------------------------------------------------

@pytest.mark.skipif(_SKIP, reason=_REASON)
class TestUniquenessML:
    def test_duplicate_rows_low_uniqueness(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        texts = ["The cat sat on the mat."] * 5
        embeddings = ml.embed_sentences(texts)
        score = _score_uniqueness_ml(0, embeddings)
        assert score < 0.2

    def test_unique_row_high_uniqueness(self):
        from verifily_cli_v1.core.ml_backends import get_ml_backends
        ml = get_ml_backends()
        texts = [
            "Machine learning uses neural networks for pattern recognition.",
            "Cooking pasta requires boiling water and adding salt.",
            "The stock market fluctuated wildly during the recession.",
            "Photosynthesis converts sunlight into chemical energy in plants.",
            "Ancient Roman architecture influenced modern building design.",
        ]
        embeddings = ml.embed_sentences(texts)
        score = _score_uniqueness_ml(0, embeddings)
        assert score > 0.3


# ---------------------------------------------------------------------------
# Full annotator with ML
# ---------------------------------------------------------------------------

@pytest.mark.skipif(_SKIP, reason=_REASON)
class TestAnnotatorML:
    def test_ml_annotation_valid_ranges(self):
        ann = Annotator(use_ml=True)
        texts = [
            "Machine learning is a subset of artificial intelligence.",
            "Natural language processing enables computers to understand text.",
        ]
        result = ann.annotate_dataset(texts)
        assert len(result.rows) == 2
        for row in result.rows:
            for ax in _AXES:
                score = getattr(row, ax)
                assert 0.0 <= score <= 1.0, f"{ax}={score} out of range"

    def test_fallback_when_ml_disabled(self):
        ann = Annotator(use_ml=False)
        texts = ["Test text with enough words for quality analysis purposes."]
        result = ann.annotate_dataset(texts)
        for ax in _AXES:
            score = getattr(result.rows[0], ax)
            assert 0.0 <= score <= 1.0

    def test_interface_identical_ml_vs_heuristic(self):
        texts = [
            "Data quality is essential for machine learning success.",
            "Preprocessing steps include cleaning and normalization.",
            "Feature engineering transforms raw data into useful inputs.",
        ]
        ann_ml = Annotator(use_ml=True).annotate_dataset(texts)
        ann_h = Annotator(use_ml=False).annotate_dataset(texts)
        # Same structure
        assert set(ann_ml.overall_profile.keys()) == set(ann_h.overall_profile.keys())
        assert len(ann_ml.rows) == len(ann_h.rows)
        assert len(ann_ml.quality_matrix) == len(ann_h.quality_matrix)
        assert set(ann_ml.axis_summaries.keys()) == set(ann_h.axis_summaries.keys())

    def test_selective_axes_still_work_with_ml(self):
        ann = Annotator(axes=["coherence", "safety"], use_ml=True)
        result = ann.annotate_dataset(["Test sentence for annotation."])
        assert result.rows[0].informativeness == 0.0
        assert result.rows[0].complexity == 0.0
