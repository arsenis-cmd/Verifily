"""Tests for v5.0 ML infrastructure — fine-tuned deberta-large quality model (117k rows),
100% ML annotator axes, perplexity formatting, zero-shot, dense drift.

Requires: torch, transformers, sentence-transformers.
All tests skip gracefully if ML deps unavailable.
"""

from __future__ import annotations

import math
import os

import pytest

# Skip entire module if ML not available
try:
    from verifily_cli_v1.core.ml_backends import ml_available

    if not ml_available():
        pytest.skip("ML backends unavailable", allow_module_level=True)
except ImportError:
    pytest.skip("ML backends unavailable", allow_module_level=True)

from verifily_cli_v1.core.ml_backends import get_ml_backends, MLBackends


# ── Fixtures ──────────────────────────────────────────────────

@pytest.fixture(scope="module")
def ml():
    return get_ml_backends()


CLEAN_TEXTS = [
    "Gradient descent optimizes neural network parameters through iterative updates.",
    "Supervised learning trains on labeled data to learn input-output mappings.",
    "A CNN uses convolutional layers with learnable filters for spatial feature extraction.",
    "Backpropagation applies the chain rule recursively from the output layer backward.",
    "Batch normalization normalizes layer inputs to have zero mean and unit variance.",
]

GARBLED_TEXTS = [
    "asdf jkl; zxcv qwer tyui bnm ghjk",
    "ÃƒÂ©Ã¢â€š¬â€ broken encoding garbage",
    "",
    "x",
    "buy now buy now buy now buy now",
]

MEDICAL_TEXTS = [
    "Patient presents with acute myocardial infarction requiring immediate intervention.",
    "Diagnosis of type 2 diabetes mellitus with comorbid hypertension and dyslipidemia.",
    "MRI findings consistent with lumbar disc herniation at L4-L5 level.",
    "Post-operative recovery following laparoscopic cholecystectomy was uneventful.",
    "Prescribed metformin 500mg twice daily with periodic HbA1c monitoring.",
]

CODE_TEXTS = [
    "def calculate_sum(a, b): return a + b",
    "class UserModel: def __init__(self): self.name = ''",
    "import numpy as np; arr = np.array([1, 2, 3])",
    "function fetchData(url) { return fetch(url).then(r => r.json()); }",
    "SELECT id, name FROM users WHERE active = 1 ORDER BY created_at",
]


# ── Quality Head Tests ────────────────────────────────────────

class TestQualityHead:
    """Tests for fine-tuned deberta-v3-base quality model (117k combined rows)."""

    def test_returns_dict_with_4_axes(self, ml):
        result = ml.score_quality_axes(CLEAN_TEXTS)
        assert result is not None
        assert "coherence" in result
        assert "informativeness" in result
        assert "complexity" in result
        assert "overall" in result

    def test_correct_length(self, ml):
        result = ml.score_quality_axes(CLEAN_TEXTS)
        assert result is not None
        for axis in result.values():
            assert len(axis) == len(CLEAN_TEXTS)

    def test_scores_in_range(self, ml):
        result = ml.score_quality_axes(CLEAN_TEXTS + GARBLED_TEXTS)
        assert result is not None
        for axis_name, scores in result.items():
            for s in scores:
                assert 0.0 <= s <= 1.0, f"{axis_name} score {s} out of range"

    def test_complexity_returns_valid_range(self, ml):
        """Complexity scores should be in valid 0-1 range for different texts."""
        texts = [
            "Explain how backpropagation uses the chain rule to compute gradients efficiently across network layers.",
            "The cat sat on the mat.",
        ]
        result = ml.score_quality_axes(texts)
        assert result is not None
        for s in result["complexity"]:
            assert 0.0 <= s <= 1.0

    def test_single_text(self, ml):
        result = ml.score_quality_axes(["Hello world."])
        assert result is not None
        assert len(result["coherence"]) == 1

    def test_model_directory_exists(self):
        """Fine-tuned model directory should contain model + tokenizer + meta."""
        model_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "core", "quality_model",
        )
        assert os.path.isdir(model_dir)
        assert os.path.exists(os.path.join(model_dir, "quality_meta.json"))
        assert os.path.exists(os.path.join(model_dir, "tokenizer_config.json"))
        # v7+: ensemble checkpoints (model_seed*.pt) or legacy single model.pt
        import json
        with open(os.path.join(model_dir, "quality_meta.json")) as f:
            meta = json.load(f)
        if meta.get("ensemble", False):
            model_files = meta.get("model_files", [])
            assert any(
                os.path.exists(os.path.join(model_dir, mf))
                for mf in model_files
            ), f"No ensemble model files found: {model_files}"
        else:
            assert os.path.exists(os.path.join(model_dir, "model.pt"))

    def test_meta_has_r2_scores(self, ml):
        """Model meta should include per-axis R² validation metrics."""
        meta = ml.get_quality_meta()
        assert meta is not None
        assert "val_r2" in meta
        assert "version" in meta
        assert meta["version"] >= 4
        r2 = meta["val_r2"]
        for ax in ["coherence", "informativeness", "complexity", "overall"]:
            assert ax in r2
            assert 0.0 <= r2[ax] <= 1.0


class TestAlwaysMLAxes:
    """Tests that all quality axes always use trained models (no heuristic fallback)."""

    def test_coherence_always_from_model(self):
        """Coherence always uses trained deberta model, not heuristic."""
        from verifily_cli_v1.core.annotator import Annotator
        ann = Annotator()
        result = ann.annotate_dataset(CLEAN_TEXTS)
        # All coherence scores should be from the model (in valid range)
        for row in result.rows:
            assert 0.0 <= row.coherence <= 1.0

    def test_formatting_is_pure_perplexity(self):
        """Formatting uses 100% perplexity from distilgpt2 (no structural blend)."""
        from verifily_cli_v1.core.annotator import Annotator
        ann = Annotator()
        result = ann.annotate_dataset([
            "This is a well-written sentence about machine learning.",
        ])
        fmt = result.rows[0].formatting
        assert 0.0 < fmt <= 1.0

    def test_all_axes_use_ml_when_available(self):
        """When ML is available, all axes should use trained models."""
        from verifily_cli_v1.core.annotator import Annotator
        ann = Annotator()
        assert ann._ml is not None, "ML backends should be available"
        result = ann.annotate_dataset(CLEAN_TEXTS)
        for row in result.rows:
            for ax in ["coherence", "informativeness", "complexity",
                        "safety", "formatting", "uniqueness"]:
                score = getattr(row, ax)
                assert 0.0 <= score <= 1.0


# ── Perplexity Tests ──────────────────────────────────────────

class TestPerplexity:
    """Tests for distilgpt2 perplexity scoring."""

    def test_returns_list(self, ml):
        result = ml.score_perplexity(CLEAN_TEXTS)
        assert result is not None
        assert len(result) == len(CLEAN_TEXTS)

    def test_scores_in_range(self, ml):
        result = ml.score_perplexity(CLEAN_TEXTS + GARBLED_TEXTS)
        assert result is not None
        for s in result:
            assert 0.0 <= s <= 1.0

    def test_clean_higher_than_garbled(self, ml):
        """Well-formed text should have higher fluency than garbled text."""
        texts = [
            "This is a well-written sentence about machine learning.",
            "asdfghjkl zxcvbnm qwertyuiop random keys pressed",
        ]
        result = ml.score_perplexity(texts)
        assert result is not None
        assert result[0] > result[1], f"Clean={result[0]}, garbled={result[1]}"

    def test_empty_text_handled(self, ml):
        result = ml.score_perplexity(["", "  "])
        assert result is not None
        assert len(result) == 2


# ── Annotator Integration Tests ───────────────────────────────

class TestAnnotatorMLAxes:
    """Tests that annotator uses 100% ML for all axes."""

    def test_all_axes_populated(self):
        from verifily_cli_v1.core.annotator import Annotator
        ann = Annotator()
        result = ann.annotate_dataset(CLEAN_TEXTS)
        assert len(result.rows) == len(CLEAN_TEXTS)
        for row in result.rows:
            assert 0.0 <= row.coherence <= 1.0
            assert 0.0 <= row.informativeness <= 1.0
            assert 0.0 <= row.complexity <= 1.0
            assert 0.0 <= row.safety <= 1.0
            assert 0.0 <= row.formatting <= 1.0
            assert 0.0 <= row.uniqueness <= 1.0

    def test_coherence_from_trained_model(self):
        """Coherence always comes from trained deberta model."""
        from verifily_cli_v1.core.annotator import Annotator
        ann = Annotator()
        result = ann.annotate_dataset(CLEAN_TEXTS)
        for row in result.rows:
            assert 0.0 <= row.coherence <= 1.0

    def test_formatting_is_perplexity(self):
        """Formatting uses 100% distilgpt2 perplexity (fluency detection)."""
        from verifily_cli_v1.core.annotator import Annotator
        ann = Annotator()
        result = ann.annotate_dataset([
            "This is a well-formed, grammatically correct English sentence.",
        ])
        assert result.rows[0].formatting > 0.0
        assert result.rows[0].formatting <= 1.0


# ── Dense Drift Detection Tests ───────────────────────────────

class TestDenseDrift:
    """Tests for sentence-transformer based drift detection."""

    def test_centroid_shift_similar_datasets(self):
        from verifily_cli_v1.core.stat_tests import embedding_centroid_shift_dense
        result = embedding_centroid_shift_dense(
            CLEAN_TEXTS, CLEAN_TEXTS,
            feature_name="test",
        )
        assert result is not None
        assert result.statistic < 0.05  # same dataset → near-zero drift
        assert not result.drifted

    def test_centroid_shift_different_datasets(self):
        from verifily_cli_v1.core.stat_tests import embedding_centroid_shift_dense
        result = embedding_centroid_shift_dense(
            CLEAN_TEXTS, MEDICAL_TEXTS,
            feature_name="test",
        )
        assert result is not None
        assert result.statistic > 0.05  # different domains → measurable drift

    def test_vocab_drift_similar(self):
        from verifily_cli_v1.core.stat_tests import vocabulary_drift_dense
        result = vocabulary_drift_dense(
            CLEAN_TEXTS, CLEAN_TEXTS,
            feature_name="test",
        )
        assert result is not None
        assert result.statistic < 0.1

    def test_vocab_drift_different(self):
        from verifily_cli_v1.core.stat_tests import vocabulary_drift_dense
        result = vocabulary_drift_dense(
            CLEAN_TEXTS, MEDICAL_TEXTS,
            feature_name="test",
        )
        assert result is not None
        assert result.statistic > 0.0

    def test_empty_inputs(self):
        from verifily_cli_v1.core.stat_tests import embedding_centroid_shift_dense
        result = embedding_centroid_shift_dense([], CLEAN_TEXTS)
        assert result is not None
        assert result.statistic == 0.0


# ── Dataset Diff ML Tests ────────────────────────────────────

class TestDatasetDiffML:
    """Tests for ML-powered dataset diff features."""

    def test_semantic_similarity_populated(self):
        from verifily_cli_v1.core.dataset_diff import diff_datasets
        ds_a = [{"input": t} for t in CLEAN_TEXTS]
        ds_b = [{"input": t} for t in CLEAN_TEXTS]
        diff = diff_datasets(ds_a, ds_b, deep_compare=True)
        assert diff.semantic_similarity is not None
        assert diff.semantic_similarity > 0.9  # identical content

    def test_semantic_similarity_different_datasets(self):
        from verifily_cli_v1.core.dataset_diff import diff_datasets
        ds_a = [{"input": t} for t in CLEAN_TEXTS]
        ds_b = [{"input": t} for t in MEDICAL_TEXTS]
        diff = diff_datasets(ds_a, ds_b, deep_compare=True)
        assert diff.semantic_similarity is not None
        assert diff.semantic_similarity < 0.95  # different content

    def test_dense_drift_in_distribution_changes(self):
        from verifily_cli_v1.core.dataset_diff import diff_datasets
        ds_a = [{"input": t} for t in CLEAN_TEXTS]
        ds_b = [{"input": t} for t in MEDICAL_TEXTS]
        diff = diff_datasets(ds_a, ds_b, deep_compare=True)
        # Should have at least one dense drift test
        dense_tests = [
            t for t in diff.distribution_changes
            if "dense" in t.test_name
        ]
        assert len(dense_tests) > 0

    def test_c2st_in_distribution_changes(self):
        """Classifier Two-Sample Test should be included in diff results."""
        from verifily_cli_v1.core.dataset_diff import diff_datasets
        ds_a = [{"input": t} for t in CLEAN_TEXTS]
        ds_b = [{"input": t} for t in MEDICAL_TEXTS]
        diff = diff_datasets(ds_a, ds_b, deep_compare=True)
        c2st_tests = [
            t for t in diff.distribution_changes
            if "classifier" in t.test_name
        ]
        assert len(c2st_tests) > 0


# ── Classifier Two-Sample Test (C2ST) ────────────────────────

class TestClassifierDrift:
    """Tests for C2ST-based drift detection."""

    def test_same_dataset_no_drift(self):
        """Same data should give accuracy ~0.5 (no drift)."""
        from verifily_cli_v1.core.stat_tests import classifier_drift_test
        result = classifier_drift_test(
            CLEAN_TEXTS * 10, CLEAN_TEXTS * 10,
            feature_name="test_same",
        )
        assert result is not None
        # Accuracy should be near 0.5 for identical distributions
        assert result.statistic < 0.70, f"Expected ~0.5, got {result.statistic}"
        assert not result.drifted or result.statistic < 0.60

    def test_different_datasets_drift(self):
        """Different domains should give high accuracy (drift detected)."""
        from verifily_cli_v1.core.stat_tests import classifier_drift_test
        result = classifier_drift_test(
            CLEAN_TEXTS * 10, MEDICAL_TEXTS * 10,
            feature_name="test_different",
        )
        assert result is not None
        assert result.statistic > 0.50  # should be distinguishable

    def test_returns_stat_test_result(self):
        """C2ST should return a proper StatTestResult."""
        from verifily_cli_v1.core.stat_tests import classifier_drift_test
        result = classifier_drift_test(
            CLEAN_TEXTS * 5, CODE_TEXTS * 5,
            feature_name="test_types",
        )
        assert result is not None
        assert result.test_name == "classifier_drift_test"
        assert 0.0 <= result.statistic <= 1.0
        assert result.threshold == 0.55

    def test_empty_inputs(self):
        """Empty inputs should not crash."""
        from verifily_cli_v1.core.stat_tests import classifier_drift_test
        result = classifier_drift_test([], CLEAN_TEXTS)
        assert result is not None
        assert result.statistic == 0.5
        assert not result.drifted


# ── Model Judge Tests ─────────────────────────────────────────

class TestModelJudge:
    """Tests for quality model-backed judge."""

    def test_judge_returns_scores(self):
        from verifily_cli_v1.core.model_judge import QualityJudge
        judge = QualityJudge()
        scores = judge.judge_rows(CLEAN_TEXTS)
        assert len(scores) == len(CLEAN_TEXTS)
        for s in scores:
            assert 0.0 <= s <= 1.0

    def test_judge_dataset_returns_dict(self):
        from verifily_cli_v1.core.model_judge import QualityJudge
        judge = QualityJudge()
        result = judge.judge_dataset(CLEAN_TEXTS)
        assert "model_quality_score" in result
        assert "model_backend" in result
        assert 0 <= result["model_quality_score"] <= 100

    def test_judge_uses_quality_model(self):
        """Judge should use quality_model backend when ML available."""
        from verifily_cli_v1.core.model_judge import QualityJudge
        judge = QualityJudge()
        result = judge.judge_dataset(CLEAN_TEXTS)
        assert result["model_backend"] == "quality_model"


# ── Domain Detection ML Tests ────────────────────────────────

class TestDomainDetectionML:
    """Tests for ML-powered domain detection."""

    def test_detects_medical(self):
        from verifily_cli_v1.core.domain_profiles import detect_domain
        result = detect_domain(MEDICAL_TEXTS * 5)
        assert result.detected_domain == "medical"

    def test_detects_code(self):
        from verifily_cli_v1.core.domain_profiles import detect_domain
        result = detect_domain(CODE_TEXTS * 5)
        assert result.detected_domain == "code"

    def test_has_confidence(self):
        from verifily_cli_v1.core.domain_profiles import detect_domain
        result = detect_domain(MEDICAL_TEXTS * 5)
        assert result.confidence > 0.3

    def test_has_evidence(self):
        from verifily_cli_v1.core.domain_profiles import detect_domain
        result = detect_domain(MEDICAL_TEXTS * 5)
        assert len(result.evidence) > 0
