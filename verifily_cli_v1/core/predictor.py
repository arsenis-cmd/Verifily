"""Data quality predictor for Verifily.

Predicts expected training outcomes from dataset quality features.
Uses a trained Ridge regression model (sklearn) when trained weights are available,
falls back to hand-calibrated weights otherwise.
"""

from __future__ import annotations

import json
import math
import os
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional

from verifily_cli_v1.core.annotator import (
    Annotator,
    DatasetAnnotation,
    _AXES,
)
from verifily_cli_v1.core.quality import QualityReport


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class RiskFactor:
    """A risk factor affecting training outcomes."""
    name: str
    impact: float       # 0-1, estimated impact on training
    affected_rows: int
    mitigation: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class QualityPrediction:
    """Prediction of training outcomes from dataset quality."""
    predicted_quality_tier: str       # "excellent", "good", "fair", "poor", "unusable"
    confidence: float                 # 0-1
    estimated_loss_multiplier: float  # 1.0 = baseline, >1 = worse, <1 = better
    risk_factors: List[RiskFactor]
    recommendations: List[str]
    what_if: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "predicted_quality_tier": self.predicted_quality_tier,
            "confidence": round(self.confidence, 3),
            "estimated_loss_multiplier": round(self.estimated_loss_multiplier, 3),
            "risk_factors": [r.to_dict() for r in self.risk_factors],
            "recommendations": self.recommendations,
            "what_if": self.what_if,
        }


# ---------------------------------------------------------------------------
# Feature extraction
# ---------------------------------------------------------------------------

def _extract_prediction_features(
    report: QualityReport,
    annotation: DatasetAnnotation,
) -> List[float]:
    """Extract 30-dim feature vector for prediction.

    [0-5]   axis means
    [6-11]  axis p5 values (tail quality)
    [12-17] axis std devs (consistency)
    [18]    quality_score from report
    [19]    total_issues
    [20]    error_fraction
    [21]    dup_fraction
    [22]    type_token_ratio
    [23]    hapax_ratio
    [24]    topic_diversity
    [25]    length_cv
    [26]    log(dataset_size)
    [27]    empty_fraction
    [28]    encoding_fraction
    [29]    bias
    """
    features: List[float] = []

    # Axis means [0-5]
    for ax in _AXES:
        features.append(annotation.overall_profile.get(ax, 0.0))

    # Axis p5 values [6-11]
    for ax in _AXES:
        summary = annotation.axis_summaries.get(ax)
        features.append(summary.p5 if summary else 0.0)

    # Axis std devs [12-17]
    for ax in _AXES:
        summary = annotation.axis_summaries.get(ax)
        features.append(summary.std if summary else 0.0)

    # Quality score [18]
    features.append(report.quality_score / 100.0)

    # Issue counts [19-20]
    features.append(float(len(report.issues)) / 10.0)  # normalized

    error_count = sum(1 for i in report.issues if i.severity == "error")
    features.append(error_count / max(1, len(report.issues)))

    # Dup fraction [21]
    dup_frac = 0.0
    for issue in report.issues:
        if "duplicate" in issue.category or "near_dup" in issue.category:
            dup_frac = max(dup_frac, issue.fraction)
    features.append(dup_frac)

    # Vocabulary stats [22-23]
    features.append(float(report.stats.get("type_token_ratio", 0.0)))
    features.append(float(report.stats.get("hapax_ratio", 0.0)))

    # Topic diversity [24]
    features.append(float(report.stats.get("topic_diversity", 0.0)))

    # Length CV [25]
    mean = float(report.stats.get("length_mean", 0.0))
    lmin = float(report.stats.get("length_min", 0.0))
    lmax = float(report.stats.get("length_max", 0.0))
    if mean > 0 and lmax > lmin:
        features.append((lmax - lmin) / (4.0 * mean))
    else:
        features.append(0.0)

    # Log dataset size [26]
    features.append(math.log1p(report.total_rows))

    # Empty and encoding fractions [27-28]
    empty_frac = 0.0
    enc_frac = 0.0
    for issue in report.issues:
        if issue.category == "empty_or_low_info":
            empty_frac = issue.fraction
        elif issue.category == "encoding_issue":
            enc_frac = issue.fraction
    features.append(empty_frac)
    features.append(enc_frac)

    # Bias [29]
    features.append(1.0)

    return features


# ---------------------------------------------------------------------------
# Calibrated weights
# ---------------------------------------------------------------------------

# 30 weights calibrated from published quality-performance curves:
# - FineWeb-Edu: quality filtering → relative performance
# - Corruption studies: noise → loss multiplier (exponential)
# - Diversity research: coverage → convergence speed
#
# These predict a "quality utility" score 0-1 via sigmoid(dot(features, weights)).
# Loss multiplier = 1 / quality_utility (higher quality → lower loss).

_PREDICTION_WEIGHTS: List[float] = [
    +0.80,   # coherence_mean [0]
    +0.60,   # informativeness_mean [1]
    +0.30,   # complexity_mean [2]
    +0.70,   # safety_mean [3]
    +0.40,   # formatting_mean [4]
    +0.50,   # uniqueness_mean [5]
    +0.25,   # coherence_p5 [6]
    +0.20,   # informativeness_p5 [7]
    +0.10,   # complexity_p5 [8]
    +0.30,   # safety_p5 [9]
    +0.15,   # formatting_p5 [10]
    +0.20,   # uniqueness_p5 [11]
    -0.30,   # coherence_std [12]
    -0.25,   # informativeness_std [13]
    -0.10,   # complexity_std [14]
    -0.35,   # safety_std [15]
    -0.20,   # formatting_std [16]
    -0.25,   # uniqueness_std [17]
    +1.20,   # quality_score [18]
    -0.50,   # total_issues_norm [19]
    -0.80,   # error_fraction [20]
    -1.00,   # dup_fraction [21]
    +0.30,   # type_token_ratio [22]
    +0.20,   # hapax_ratio [23]
    +0.25,   # topic_diversity [24]
    -0.40,   # length_cv [25]
    -0.10,   # log_dataset_size [26]
    -0.90,   # empty_fraction [27]
    -0.70,   # encoding_fraction [28]
    -0.50,   # bias [29]
]


# ---------------------------------------------------------------------------
# Trained weight loading
# ---------------------------------------------------------------------------

_WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "predictor_weights.json")

_trained_model: Optional[Dict[str, Any]] = None


def _load_trained_model() -> Optional[Dict[str, Any]]:
    """Load trained weights from predictor_weights.json if available."""
    global _trained_model
    if _trained_model is not None:
        return _trained_model

    if not os.path.exists(_WEIGHTS_PATH):
        return None

    try:
        with open(_WEIGHTS_PATH, "r") as f:
            data = json.load(f)
        if (
            data.get("version") == 1
            and "weights" in data
            and "intercept" in data
            and len(data["weights"]) == 30
        ):
            _trained_model = data
            return _trained_model
    except Exception:
        pass
    return None


def _predict_trained(features: List[float]) -> float:
    """Predict utility using trained Ridge model with StandardScaler."""
    model = _load_trained_model()
    if model is None:
        return -1.0

    weights = model["weights"]
    intercept = model["intercept"]
    means = model.get("scaler_means", [])
    scales = model.get("scaler_scales", [])

    if means and scales and len(means) == len(features):
        # Apply StandardScaler: (x - mean) / scale
        scaled = [
            (f - m) / s if s > 0 else 0.0
            for f, m, s in zip(features, means, scales)
        ]
    else:
        scaled = features

    z = sum(f * w for f, w in zip(scaled, weights)) + intercept
    # Return -1.0 (signal to use fallback) when raw z is far out of
    # distribution — the model was only trained on one dataset and can
    # produce wildly wrong scores on OOD inputs.
    if z < -1.0 or z > 2.0:
        return -1.0
    return max(0.0, min(1.0, z))


# ---------------------------------------------------------------------------
# Prediction logic
# ---------------------------------------------------------------------------

def _sigmoid(z: float) -> float:
    if z >= 0:
        return 1.0 / (1.0 + math.exp(-z))
    else:
        ez = math.exp(z)
        return ez / (1.0 + ez)


def _quality_tier(utility: float) -> str:
    """Map quality utility (0-1) to a tier name."""
    if utility >= 0.85:
        return "excellent"
    elif utility >= 0.70:
        return "good"
    elif utility >= 0.50:
        return "fair"
    elif utility >= 0.30:
        return "poor"
    return "unusable"


def _identify_risk_factors(
    report: QualityReport,
    annotation: DatasetAnnotation,
) -> List[RiskFactor]:
    """Identify top risk factors from report and annotations."""
    risks: List[RiskFactor] = []

    # Check for duplication issues (take worst match only)
    dup_issues = [i for i in report.issues
                  if ("duplicate" in i.category or "near_dup" in i.category) and i.fraction > 0.05]
    if dup_issues:
        worst = max(dup_issues, key=lambda i: i.fraction)
        risks.append(RiskFactor(
            name="high_duplication",
            impact=min(1.0, worst.fraction * 2),
            affected_rows=worst.count,
            mitigation="Deduplicate dataset using `verifily select --dedup-threshold 0.85`",
        ))

    # Check for empty/low-info rows
    for issue in report.issues:
        if issue.category == "empty_or_low_info" and issue.fraction > 0.05:
            risks.append(RiskFactor(
                name="empty_rows",
                impact=min(1.0, issue.fraction * 1.5),
                affected_rows=issue.count,
                mitigation="Remove empty rows with `verifily select --quality-threshold 0.3`",
            ))

    # Check for low diversity
    diversity = annotation.overall_profile.get("uniqueness", 1.0)
    if diversity < 0.3:
        risks.append(RiskFactor(
            name="low_diversity",
            impact=0.6,
            affected_rows=report.total_rows,
            mitigation="Increase diversity with `verifily select --strategy diverse`",
        ))

    # Check for safety issues
    safety = annotation.overall_profile.get("safety", 1.0)
    if safety < 0.8:
        risks.append(RiskFactor(
            name="safety_concerns",
            impact=min(1.0, (1.0 - safety) * 2),
            affected_rows=int(report.total_rows * (1.0 - safety)),
            mitigation="Filter unsafe rows with `verifily annotate --min-score 0.8`",
        ))

    # Check for encoding issues
    for issue in report.issues:
        if issue.category == "encoding_issue" and issue.fraction > 0.02:
            risks.append(RiskFactor(
                name="encoding_corruption",
                impact=min(1.0, issue.fraction * 3),
                affected_rows=issue.count,
                mitigation="Fix encoding issues in data preprocessing",
            ))

    # Sort by impact
    risks.sort(key=lambda r: -r.impact)
    return risks[:5]


def _generate_recommendations(
    tier: str,
    risks: List[RiskFactor],
    report: QualityReport,
) -> List[str]:
    """Generate actionable recommendations."""
    recs: List[str] = []

    if tier in ("poor", "unusable"):
        recs.append("Dataset quality is too low for reliable training. "
                     "Consider significant data cleaning before proceeding.")

    for risk in risks[:3]:
        recs.append(risk.mitigation)

    if report.total_rows < 100:
        recs.append("Dataset is very small. Consider augmenting with more data.")

    if not recs:
        recs.append("Dataset quality looks good. Proceed with training.")

    return recs


# ---------------------------------------------------------------------------
# QualityPredictor
# ---------------------------------------------------------------------------

class QualityPredictor:
    """Predicts training impact from dataset quality features."""

    def predict(
        self,
        quality_report: QualityReport,
        annotation: DatasetAnnotation,
        dataset_size: int,
    ) -> QualityPrediction:
        """Predict training outcome quality.

        Args:
            quality_report: From analyze_quality().
            annotation: From Annotator.annotate_dataset().
            dataset_size: Number of rows in the dataset.
        """
        if dataset_size == 0:
            return QualityPrediction(
                predicted_quality_tier="unusable",
                confidence=1.0,
                estimated_loss_multiplier=10.0,
                risk_factors=[],
                recommendations=["Dataset is empty."],
            )

        features = _extract_prediction_features(quality_report, annotation)

        # Try trained model first, fall back to hand-coded weights
        trained_utility = _predict_trained(features)
        if trained_utility >= 0.0:
            utility = trained_utility
        else:
            if len(features) != len(_PREDICTION_WEIGHTS):
                raise ValueError(
                    f"Feature length ({len(features)}) != "
                    f"weights length ({len(_PREDICTION_WEIGHTS)})"
                )
            z = sum(f * w for f, w in zip(features, _PREDICTION_WEIGHTS))
            utility = _sigmoid(z)

        tier = _quality_tier(utility)
        confidence = min(1.0, 0.5 + abs(utility - 0.5))

        # Loss multiplier: high quality → low loss, low quality → high loss
        loss_mult = 1.0 / max(0.1, utility)

        risks = _identify_risk_factors(quality_report, annotation)
        recommendations = _generate_recommendations(tier, risks, quality_report)

        return QualityPrediction(
            predicted_quality_tier=tier,
            confidence=round(confidence, 3),
            estimated_loss_multiplier=round(loss_mult, 3),
            risk_factors=risks,
            recommendations=recommendations,
        )

    def what_if_remove(
        self,
        rows: List[Dict],
        texts: List[str],
        filter_axis: str,
        filter_threshold: float,
    ) -> QualityPrediction:
        """Predict outcome if rows below threshold on axis are removed.

        Returns prediction for the filtered dataset.
        """
        from verifily_cli_v1.core.quality import analyze_quality

        annotator = Annotator()
        annotation = annotator.annotate_dataset(texts)

        # Filter rows
        keep = []
        keep_rows = []
        keep_texts = []
        for i, ann in enumerate(annotation.rows):
            val = getattr(ann, filter_axis, None)
            if val is not None and val >= filter_threshold:
                keep.append(i)
                keep_rows.append(rows[i])
                keep_texts.append(texts[i])

        if not keep_rows:
            return QualityPrediction(
                predicted_quality_tier="unusable",
                confidence=1.0,
                estimated_loss_multiplier=10.0,
                risk_factors=[],
                recommendations=[
                    f"No rows pass {filter_axis} >= {filter_threshold}. "
                    "Lower the threshold."
                ],
            )

        # Re-analyze filtered dataset
        filtered_report = analyze_quality(keep_rows)
        filtered_annotation = annotator.annotate_dataset(keep_texts)

        return self.predict(
            filtered_report, filtered_annotation, len(keep_rows),
        )
