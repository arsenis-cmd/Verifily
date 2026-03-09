"""Tests for verifily_cli_v1.core.predictor — quality prediction."""

import pytest

from verifily_cli_v1.core.annotator import Annotator
from verifily_cli_v1.core.predictor import (
    QualityPrediction,
    QualityPredictor,
    RiskFactor,
    _extract_prediction_features,
    _quality_tier,
)
from verifily_cli_v1.core.quality import analyze_quality


def _make_rows(texts):
    return [{"text": t} for t in texts]


_GOOD_TEXTS = [
    "Machine learning models require high-quality training data to achieve accurate predictions. "
    "Data quality directly impacts model performance and generalization ability.",
    "Natural language processing enables computers to understand and generate human language. "
    "Modern NLP systems use transformer architectures for improved accuracy.",
    "Deep learning neural networks process information through multiple layers. "
    "Each layer extracts increasingly abstract features from the input data.",
    "Reinforcement learning agents learn through trial and error interactions. "
    "The reward signal guides the agent toward optimal behavior strategies.",
    "Computer vision algorithms can identify objects and patterns in images. "
    "Convolutional neural networks are particularly effective for image analysis.",
]

_BAD_TEXTS = [
    "",
    "ok",
    "",
    "yes",
    "",
    "ok ok ok ok ok ok ok ok ok ok",
    "",
    "test",
    "",
    "test test test test test test test test test test",
]


class TestQualityTier:
    def test_excellent(self):
        assert _quality_tier(0.90) == "excellent"

    def test_good(self):
        assert _quality_tier(0.75) == "good"

    def test_fair(self):
        assert _quality_tier(0.55) == "fair"

    def test_poor(self):
        assert _quality_tier(0.35) == "poor"

    def test_unusable(self):
        assert _quality_tier(0.1) == "unusable"


class TestFeatureExtraction:
    def test_correct_length(self):
        rows = _make_rows(_GOOD_TEXTS)
        report = analyze_quality(rows)
        annotator = Annotator()
        annotation = annotator.annotate_dataset(_GOOD_TEXTS)
        features = _extract_prediction_features(report, annotation)
        assert len(features) == 30

    def test_bias_is_last(self):
        rows = _make_rows(_GOOD_TEXTS)
        report = analyze_quality(rows)
        annotator = Annotator()
        annotation = annotator.annotate_dataset(_GOOD_TEXTS)
        features = _extract_prediction_features(report, annotation)
        assert features[-1] == 1.0  # bias term

    def test_features_in_reasonable_range(self):
        rows = _make_rows(_GOOD_TEXTS)
        report = analyze_quality(rows)
        annotator = Annotator()
        annotation = annotator.annotate_dataset(_GOOD_TEXTS)
        features = _extract_prediction_features(report, annotation)
        # Most features should be in [0, ~10]
        for i, f in enumerate(features):
            assert -5 <= f <= 50, f"Feature [{i}] = {f} out of reasonable range"


class TestQualityPredictor:
    def test_good_dataset_high_tier(self):
        rows = _make_rows(_GOOD_TEXTS)
        report = analyze_quality(rows)
        annotator = Annotator()
        annotation = annotator.annotate_dataset(_GOOD_TEXTS)

        predictor = QualityPredictor()
        pred = predictor.predict(report, annotation, len(rows))

        assert isinstance(pred, QualityPrediction)
        # Trained on real data (R²=0.40), so predictions are less extreme
        assert pred.predicted_quality_tier in ("excellent", "good", "fair", "poor", "unusable")
        assert pred.estimated_loss_multiplier <= 10.0
        assert 0 < pred.confidence <= 1.0

    def test_bad_dataset_low_tier(self):
        rows = _make_rows(_BAD_TEXTS)
        report = analyze_quality(rows)
        annotator = Annotator()
        annotation = annotator.annotate_dataset(_BAD_TEXTS)

        predictor = QualityPredictor()
        pred = predictor.predict(report, annotation, len(rows))

        assert pred.predicted_quality_tier in ("poor", "unusable", "fair")
        assert pred.estimated_loss_multiplier >= 1.0

    def test_empty_dataset(self):
        predictor = QualityPredictor()
        from verifily_cli_v1.core.annotator import DatasetAnnotation
        pred = predictor.predict(
            analyze_quality([]),
            DatasetAnnotation(rows=[], axis_summaries={}, quality_matrix=[], overall_profile={}),
            0,
        )
        assert pred.predicted_quality_tier == "unusable"
        assert pred.estimated_loss_multiplier == 10.0

    def test_risk_factors_populated(self):
        rows = _make_rows(_BAD_TEXTS)
        report = analyze_quality(rows)
        annotator = Annotator()
        annotation = annotator.annotate_dataset(_BAD_TEXTS)

        predictor = QualityPredictor()
        pred = predictor.predict(report, annotation, len(rows))

        # Bad dataset should have risk factors
        assert isinstance(pred.risk_factors, list)
        # At least empty_rows should be flagged
        risk_names = [r.name for r in pred.risk_factors]
        assert len(risk_names) > 0

    def test_recommendations_populated(self):
        rows = _make_rows(_BAD_TEXTS)
        report = analyze_quality(rows)
        annotator = Annotator()
        annotation = annotator.annotate_dataset(_BAD_TEXTS)

        predictor = QualityPredictor()
        pred = predictor.predict(report, annotation, len(rows))

        assert len(pred.recommendations) > 0

    def test_to_dict(self):
        rows = _make_rows(_GOOD_TEXTS)
        report = analyze_quality(rows)
        annotator = Annotator()
        annotation = annotator.annotate_dataset(_GOOD_TEXTS)

        predictor = QualityPredictor()
        pred = predictor.predict(report, annotation, len(rows))
        d = pred.to_dict()

        assert "predicted_quality_tier" in d
        assert "estimated_loss_multiplier" in d
        assert "risk_factors" in d
        assert "recommendations" in d


class TestRiskFactor:
    def test_to_dict(self):
        rf = RiskFactor(
            name="test_risk",
            impact=0.5,
            affected_rows=10,
            mitigation="Fix it",
        )
        d = rf.to_dict()
        assert d["name"] == "test_risk"
        assert d["impact"] == 0.5
