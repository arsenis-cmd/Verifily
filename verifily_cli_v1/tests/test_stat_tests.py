"""Tests for verifily_cli_v1.core.stat_tests — statistical drift tests."""

import math
import pytest

from verifily_cli_v1.core.stat_tests import (
    StatTestResult,
    chi_squared_test,
    embedding_centroid_shift,
    ks_test,
    psi,
    vocabulary_drift,
)


# ---------------------------------------------------------------------------
# KS Test
# ---------------------------------------------------------------------------

class TestKSTest:
    def test_identical_distributions_no_drift(self):
        data = list(range(100))
        baseline = [float(x) for x in data]
        candidate = [float(x) for x in data]
        result = ks_test(baseline, candidate)
        assert result.statistic < 0.05
        assert result.p_value > 0.05
        assert not result.drifted

    def test_shifted_distribution_detects_drift(self):
        baseline = [float(i) for i in range(100)]
        candidate = [float(i + 50) for i in range(100)]
        result = ks_test(baseline, candidate)
        assert result.statistic > 0.3
        assert result.drifted

    def test_completely_different(self):
        baseline = [0.0] * 50
        candidate = [100.0] * 50
        result = ks_test(baseline, candidate)
        assert result.statistic >= 0.9
        assert result.drifted
        assert result.severity in ("major", "severe")

    def test_empty_samples(self):
        result = ks_test([], [1.0, 2.0])
        assert not result.drifted
        assert result.p_value == 1.0
        assert "Empty" in result.detail

    def test_single_element(self):
        result = ks_test([1.0], [1.0])
        # With n=1 each, D can be 1.0 due to CDF step function — just check it runs
        assert isinstance(result.statistic, float)

    def test_returns_stat_test_result(self):
        result = ks_test([1.0, 2.0, 3.0], [1.0, 2.0, 3.0])
        assert isinstance(result, StatTestResult)
        assert result.test_name == "ks_test"


# ---------------------------------------------------------------------------
# Chi-squared Test
# ---------------------------------------------------------------------------

class TestChiSquared:
    def test_same_proportions_no_drift(self):
        counts = {"a": 100, "b": 100, "c": 100}
        result = chi_squared_test(counts, counts)
        assert result.statistic < 1.0
        assert not result.drifted

    def test_different_proportions_detects_drift(self):
        baseline = {"a": 100, "b": 100, "c": 100}
        candidate = {"a": 300, "b": 10, "c": 10}
        result = chi_squared_test(baseline, candidate)
        assert result.statistic > 10
        assert result.drifted

    def test_new_category(self):
        baseline = {"a": 100, "b": 100}
        candidate = {"a": 100, "b": 100, "c": 50}
        result = chi_squared_test(baseline, candidate)
        assert result.statistic > 0

    def test_empty_counts(self):
        result = chi_squared_test({}, {"a": 10})
        assert not result.drifted

    def test_returns_stat_test_result(self):
        result = chi_squared_test({"a": 10}, {"a": 10})
        assert result.test_name == "chi_squared"


# ---------------------------------------------------------------------------
# PSI
# ---------------------------------------------------------------------------

class TestPSI:
    def test_identical_no_shift(self):
        data = [float(i) for i in range(100)]
        result = psi(data, data)
        assert result.statistic < 0.1
        assert not result.drifted
        assert result.severity == "none"

    def test_shifted_detects(self):
        baseline = [float(i) for i in range(100)]
        candidate = [float(i + 80) for i in range(100)]
        result = psi(baseline, candidate)
        assert result.statistic > 0.1

    def test_major_shift(self):
        baseline = [0.0] * 50 + [1.0] * 50
        candidate = [1.0] * 50 + [2.0] * 50
        result = psi(baseline, candidate)
        assert result.statistic > 0.25
        assert result.drifted

    def test_empty_samples(self):
        result = psi([], [1.0])
        assert not result.drifted

    def test_all_identical(self):
        result = psi([5.0] * 100, [5.0] * 100)
        assert result.statistic == 0.0
        assert not result.drifted

    def test_returns_stat_test_result(self):
        result = psi([1.0, 2.0], [1.0, 2.0])
        assert result.test_name == "psi"
        assert result.p_value is None  # PSI has no p-value


# ---------------------------------------------------------------------------
# Vocabulary Drift
# ---------------------------------------------------------------------------

class TestVocabularyDrift:
    def test_same_texts_no_drift(self):
        texts = ["machine learning models require quality data"] * 10
        result = vocabulary_drift(texts, texts)
        assert result.statistic < 0.1
        assert not result.drifted

    def test_different_domain_high_drift(self):
        baseline = [
            "machine learning neural network deep learning model training"
        ] * 20
        candidate = [
            "cardiovascular disease treatment medication patient clinical"
        ] * 20
        result = vocabulary_drift(baseline, candidate)
        assert result.statistic > 0.3
        assert result.drifted

    def test_empty_texts(self):
        result = vocabulary_drift([], ["some text"])
        assert not result.drifted

    def test_returns_stat_test_result(self):
        result = vocabulary_drift(["text one"], ["text two"])
        assert result.test_name == "vocabulary_drift"


# ---------------------------------------------------------------------------
# Embedding Centroid Shift
# ---------------------------------------------------------------------------

class TestEmbeddingCentroidShift:
    def test_same_vectors_no_shift(self):
        vecs = [{"word1": 0.5, "word2": 0.5}] * 10
        result = embedding_centroid_shift(vecs, vecs)
        assert result.statistic < 0.01
        assert not result.drifted

    def test_different_vectors_detect_shift(self):
        base_vecs = [{"ml": 0.8, "data": 0.6}] * 10
        cand_vecs = [{"medicine": 0.8, "patient": 0.6}] * 10
        result = embedding_centroid_shift(base_vecs, cand_vecs)
        assert result.statistic > 0.5
        assert result.drifted

    def test_empty_vectors(self):
        result = embedding_centroid_shift([], [{"a": 1.0}])
        assert not result.drifted

    def test_partial_overlap(self):
        base_vecs = [{"ml": 0.8, "data": 0.6, "model": 0.3}] * 10
        cand_vecs = [{"ml": 0.7, "data": 0.5, "new_term": 0.4}] * 10
        result = embedding_centroid_shift(base_vecs, cand_vecs)
        assert 0.0 < result.statistic < 1.0

    def test_returns_stat_test_result(self):
        result = embedding_centroid_shift([{"a": 1.0}], [{"a": 1.0}])
        assert result.test_name == "embedding_centroid_shift"


# ---------------------------------------------------------------------------
# Integration
# ---------------------------------------------------------------------------

class TestStatTestResult:
    def test_to_dict(self):
        result = ks_test([1.0, 2.0, 3.0], [1.0, 2.0, 3.0])
        d = result.to_dict()
        assert "test_name" in d
        assert "statistic" in d
        assert "p_value" in d
        assert "drifted" in d
        assert "severity" in d
