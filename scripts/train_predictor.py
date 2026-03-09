#!/usr/bin/env python3
"""Train the quality predictor weights using sklearn Ridge regression.

Two modes:
  Default: synthetic datasets with controlled quality tiers
  --real-data: samples from UltraFeedback human-rated data (breaks circular dependency)

Usage:
    python scripts/train_predictor.py             # synthetic
    python scripts/train_predictor.py --real-data  # real human scores

Outputs:
    verifily_cli_v1/core/predictor_weights.json
"""

from __future__ import annotations

import json
import math
import os
import random
import sys
from typing import Dict, List, Tuple

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from verifily_cli_v1.core.quality import analyze_quality
from verifily_cli_v1.core.annotator import Annotator, DatasetAnnotation
from verifily_cli_v1.core.predictor import _extract_prediction_features


# ---------------------------------------------------------------------------
# Synthetic data generation
# ---------------------------------------------------------------------------

_EXCELLENT_TEXTS = [
    "Explain how gradient descent optimizes neural network parameters through iterative updates.",
    "What is the difference between supervised and unsupervised learning approaches in machine learning?",
    "Describe the architecture of a convolutional neural network including convolutional, pooling, and dense layers.",
    "How does backpropagation use the chain rule to compute gradients efficiently across network layers?",
    "What are the advantages of using batch normalization to stabilize neural network training?",
    "Explain the concept of transfer learning and how pretrained models accelerate training on new tasks.",
    "How do recurrent neural networks maintain hidden state to process sequential data effectively?",
    "What is the vanishing gradient problem and what techniques mitigate it in deep networks?",
    "Describe the attention mechanism in transformer models and how it enables parallel sequence processing.",
    "How does dropout regularization prevent overfitting by randomly deactivating neurons during training?",
    "Explain the key differences between generative and discriminative machine learning models.",
    "What is the bias-variance tradeoff and how does it guide model complexity decisions?",
    "Describe how random forests combine bagging and feature randomness to reduce overfitting.",
    "How does cross-validation provide reliable estimates of model generalization performance?",
    "Explain the Adam optimizer and how it combines momentum with adaptive learning rates.",
    "What are embedding layers and how do they represent categorical data in continuous vector spaces?",
    "Describe autoencoders and their applications in dimensionality reduction and anomaly detection.",
    "How does early stopping use validation metrics to prevent overfitting during model training?",
    "What is the role of activation functions in introducing non-linearity to neural networks?",
    "Explain the differences between precision, recall, F1-score, and when to prioritize each metric.",
]

_EXCELLENT_ANSWERS = [
    "Gradient descent computes the gradient of the loss function with respect to each parameter, then updates parameters in the direction that minimizes the loss. The learning rate controls step size.",
    "Supervised learning trains on labeled data to learn input-output mappings, while unsupervised learning discovers hidden patterns in unlabeled data through clustering or dimensionality reduction.",
    "A CNN uses convolutional layers with learnable filters for spatial feature extraction, pooling layers for translation invariance and dimensionality reduction, and fully connected layers for final classification.",
    "Backpropagation applies the chain rule recursively from the output layer backward, computing gradients for each layer's weights by multiplying local gradients along the computation graph.",
    "Batch normalization normalizes layer inputs to have zero mean and unit variance, reducing internal covariate shift, enabling higher learning rates, and providing mild regularization.",
    "Transfer learning leverages a model pretrained on a large dataset as initialization for a new task, exploiting learned feature representations to achieve better performance with less data.",
    "RNNs process sequences by maintaining a hidden state vector that gets updated at each time step, combining new input with the previous hidden state through learned weight matrices.",
    "The vanishing gradient problem occurs when gradients shrink exponentially in deep networks. Solutions include ReLU activations, residual connections, LSTM gating mechanisms, and careful initialization.",
    "Attention computes relevance scores between query-key pairs, producing a weighted sum of value vectors. This allows the model to dynamically focus on relevant parts of the input sequence.",
    "Dropout randomly sets a fraction of neuron activations to zero during training, preventing co-adaptation between neurons and forcing the network to learn more distributed, robust representations.",
    "Generative models learn the joint probability distribution to generate new samples, while discriminative models learn the decision boundary directly for classification tasks.",
    "Bias measures systematic error from model simplification; variance measures sensitivity to training data fluctuations. The optimal model balances both to minimize total generalization error.",
    "Random forests build many decorrelated decision trees using bootstrap samples and random feature subsets, then average predictions to reduce variance while maintaining low bias.",
    "Cross-validation partitions data into k folds, iteratively using each fold for validation while training on the remaining data, producing k performance estimates whose mean indicates expected generalization.",
    "Adam maintains exponentially decaying averages of past gradients (first moment) and squared gradients (second moment), adapting the learning rate individually for each parameter.",
    "Embedding layers map each categorical value to a dense, low-dimensional vector that is learned during training, capturing semantic similarities in the resulting vector space.",
    "Autoencoders learn to compress inputs through a bottleneck layer and then reconstruct them, with the bottleneck representation serving as a useful lower-dimensional encoding.",
    "Early stopping monitors validation performance during training and halts when performance stops improving, choosing the model from the epoch with the best validation metric.",
    "Activation functions like ReLU, sigmoid, and tanh apply non-linear transformations to layer outputs, enabling neural networks to approximate arbitrarily complex functions.",
    "Precision quantifies correctness of positive predictions, recall quantifies coverage of true positives, and F1 balances both. Prioritize recall for safety-critical tasks and precision for low-noise needs.",
]


def _make_excellent_dataset(n: int, rng: random.Random) -> List[Dict]:
    """Generate a clean, diverse, well-formed dataset."""
    rows = []
    for i in range(n):
        q_idx = rng.randint(0, len(_EXCELLENT_TEXTS) - 1)
        a_idx = rng.randint(0, len(_EXCELLENT_ANSWERS) - 1)
        suffix = f" Variant {i}." if rng.random() > 0.4 else ""
        rows.append({
            "input": _EXCELLENT_TEXTS[q_idx] + suffix,
            "output": _EXCELLENT_ANSWERS[a_idx],
        })
    return rows


def _make_good_dataset(n: int, rng: random.Random) -> List[Dict]:
    """Generate a decent dataset with minor issues."""
    rows = []
    for i in range(n):
        q_idx = rng.randint(0, len(_EXCELLENT_TEXTS) - 1)
        a_idx = rng.randint(0, len(_EXCELLENT_ANSWERS) - 1)
        rows.append({
            "input": _EXCELLENT_TEXTS[q_idx],
            "output": _EXCELLENT_ANSWERS[a_idx][:80],  # truncated answers
        })
    # Add ~10% mild issues
    for i in range(max(1, n // 10)):
        rows.append({"input": f"short q{i}", "output": f"short a{i}"})
    rng.shuffle(rows)
    return rows[:n]


def _make_fair_dataset(n: int, rng: random.Random) -> List[Dict]:
    """Generate a mediocre dataset with noticeable problems."""
    rows = []
    for i in range(n):
        r = rng.random()
        if r < 0.15:
            rows.append({"input": "", "output": ""})
        elif r < 0.25:
            rows.append({"input": "q", "output": "a"})
        elif r < 0.35:
            # Duplicate
            rows.append({"input": "What is machine learning?",
                         "output": "ML is a subset of AI."})
        else:
            rows.append({
                "input": f"Explain topic {i} in some detail",
                "output": f"Topic {i} involves various concepts that are important",
            })
    return rows


def _make_poor_dataset(n: int, rng: random.Random) -> List[Dict]:
    """Generate a low-quality dataset."""
    rows = []
    for i in range(n):
        r = rng.random()
        if r < 0.3:
            rows.append({"input": "", "output": ""})
        elif r < 0.5:
            rows.append({"input": "buy now " * 8, "output": "buy now " * 8})
        elif r < 0.7:
            rows.append({"input": "q", "output": "a"})
        else:
            rows.append({
                "input": f"question {i}",
                "output": f"answer {i}",
            })
    return rows


def _make_unusable_dataset(n: int, rng: random.Random) -> List[Dict]:
    """Generate a terrible dataset."""
    rows = []
    for i in range(n):
        r = rng.random()
        if r < 0.4:
            rows.append({"input": "", "output": ""})
        elif r < 0.6:
            rows.append({"input": "x", "output": "y"})
        elif r < 0.8:
            rows.append({"input": "buy now " * 15, "output": "buy now " * 15})
        else:
            rows.append({
                "input": f"q Ã¢â€ broken {i}",
                "output": f"a \x00 broken {i}",
            })
    return rows


# Target utility values (what sigmoid(dot(features, weights)) should produce)
_TIER_TARGETS = {
    "excellent": 0.92,
    "good": 0.77,
    "fair": 0.58,
    "poor": 0.38,
    "unusable": 0.15,
}

_GENERATORS = {
    "excellent": _make_excellent_dataset,
    "good": _make_good_dataset,
    "fair": _make_fair_dataset,
    "poor": _make_poor_dataset,
    "unusable": _make_unusable_dataset,
}


def generate_training_data(
    n_per_tier: int = 30,
    seed: int = 42,
) -> List[Tuple[List[Dict], float, str]]:
    """Generate (dataset, target_utility, tier) triples."""
    rng = random.Random(seed)
    data: List[Tuple[List[Dict], float, str]] = []

    for tier, gen_fn in _GENERATORS.items():
        target = _TIER_TARGETS[tier]
        for i in range(n_per_tier):
            n_rows = rng.randint(20, 60)
            noise = rng.gauss(0, 0.03)
            dataset = gen_fn(n_rows, random.Random(seed + hash(tier) + i))
            data.append((dataset, max(0.01, min(0.99, target + noise)), tier))

    rng.shuffle(data)
    return data


# ---------------------------------------------------------------------------
# Feature extraction
# ---------------------------------------------------------------------------

def extract_all_features(
    labeled_data: List[Tuple[List[Dict], float, str]],
) -> Tuple[List[List[float]], List[float], List[str]]:
    """Run analyze_quality + Annotator on each dataset, extract features."""
    X: List[List[float]] = []
    y: List[float] = []
    tiers: List[str] = []
    annotator = Annotator(use_ml=False)  # Heuristic for speed during training

    for idx, (rows, target, tier) in enumerate(labeled_data):
        try:
            report = analyze_quality(rows)
            texts = []
            for row in rows:
                parts = [str(v) for v in row.values() if isinstance(v, str) and v.strip()]
                texts.append(" ".join(parts) if parts else "")
            annotation = annotator.annotate_dataset(texts)
            features = _extract_prediction_features(report, annotation)
            X.append(features)
            y.append(target)
            tiers.append(tier)
        except Exception as e:
            print(f"  Warning: skipped dataset {idx} ({tier}): {e}")

        if (idx + 1) % 25 == 0:
            print(f"  Processed {idx + 1}/{len(labeled_data)} datasets...")

    return X, y, tiers


# ---------------------------------------------------------------------------
# Training with sklearn
# ---------------------------------------------------------------------------

def train_ridge(
    X: List[List[float]],
    y: List[float],
    alpha: float = 1.0,
) -> Tuple[List[float], float, List[float], List[float]]:
    """Train Ridge regression with StandardScaler. Returns (weights, intercept, means, scales)."""
    from sklearn.linear_model import Ridge
    from sklearn.preprocessing import StandardScaler
    import numpy as np

    X_arr = np.array(X, dtype=np.float64)
    y_arr = np.array(y, dtype=np.float64)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_arr)

    model = Ridge(alpha=alpha)
    model.fit(X_scaled, y_arr)

    return (
        model.coef_.tolist(),
        float(model.intercept_),
        scaler.mean_.tolist(),
        scaler.scale_.tolist(),
    )


def cross_validate(
    X: List[List[float]],
    y: List[float],
    n_folds: int = 5,
    alpha: float = 1.0,
) -> Tuple[float, float]:
    """5-fold cross-validation. Returns (mean_r2, std_r2)."""
    from sklearn.linear_model import Ridge
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import cross_val_score
    from sklearn.pipeline import Pipeline
    import numpy as np

    X_arr = np.array(X, dtype=np.float64)
    y_arr = np.array(y, dtype=np.float64)

    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("ridge", Ridge(alpha=alpha)),
    ])
    scores = cross_val_score(pipe, X_arr, y_arr, cv=n_folds, scoring="r2")
    return float(scores.mean()), float(scores.std())


# ---------------------------------------------------------------------------
# Pure Python fallback (if sklearn unavailable)
# ---------------------------------------------------------------------------

def _sigmoid(z: float) -> float:
    if z >= 0:
        return 1.0 / (1.0 + math.exp(-z))
    else:
        ez = math.exp(z)
        return ez / (1.0 + ez)


def train_pure_python(
    X: List[List[float]],
    y: List[float],
    lr: float = 0.005,
    epochs: int = 5000,
    l2_lambda: float = 0.01,
) -> List[float]:
    """Fallback: train via gradient descent without sklearn."""
    n_features = len(X[0])
    n_samples = len(X)
    rng = random.Random(42)
    weights = [rng.gauss(0, 0.01) for _ in range(n_features)]

    for epoch in range(epochs):
        grads = [0.0] * n_features
        total_loss = 0.0

        for i in range(n_samples):
            z = sum(f * w for f, w in zip(X[i], weights))
            pred = max(0.001, min(0.999, z))  # linear regression
            error = pred - y[i]
            total_loss += error * error

            for j in range(n_features):
                grads[j] += 2 * error * X[i][j]

        for j in range(n_features):
            grads[j] = grads[j] / n_samples + l2_lambda * weights[j]
            weights[j] -= lr * grads[j]

        if epoch % 1000 == 0 or epoch == epochs - 1:
            mse = total_loss / n_samples
            print(f"  Epoch {epoch:5d}/{epochs}: MSE = {mse:.6f}")

    return weights


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

def export_weights(
    weights: List[float],
    intercept: float,
    means: List[float],
    scales: List[float],
    r2_mean: float,
    r2_std: float,
    output_path: str,
) -> None:
    """Write trained weights to JSON."""
    payload = {
        "version": 1,
        "model": "ridge",
        "n_features": len(weights),
        "weights": [round(w, 8) for w in weights],
        "intercept": round(intercept, 8),
        "scaler_means": [round(m, 8) for m in means],
        "scaler_scales": [round(s, 8) for s in scales],
        "cross_val_r2_mean": round(r2_mean, 4),
        "cross_val_r2_std": round(r2_std, 4),
    }

    with open(output_path, "w") as f:
        json.dump(payload, f, indent=2)
    print(f"\n  Exported to {output_path}")


# ---------------------------------------------------------------------------
# Real data mode (UltraFeedback human scores)
# ---------------------------------------------------------------------------

DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "verifily_cli_v1", "data",
)


def _load_ultrafeedback() -> List[Dict]:
    """Load UltraFeedback JSONL rows."""
    path = os.path.join(DATA_DIR, "ultrafeedback.jsonl")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"{path} not found. Run: python scripts/download_training_data.py"
        )
    rows = []
    with open(path) as f:
        for line in f:
            row = json.loads(line)
            if "overall_score" in row and "text" in row:
                rows.append(row)
    return rows


def _sample_dataset_from_ultrafeedback(
    all_rows: List[Dict],
    n_rows: int,
    quality_bias: float,
    rng: random.Random,
) -> Tuple[List[Dict], float]:
    """Sample a mini-dataset from UltraFeedback with quality bias.

    quality_bias controls what quality level to sample:
      1.0 = prefer high-scoring rows, 0.0 = prefer low-scoring rows

    Returns (dataset_rows, avg_human_score_normalized_0_1).
    """
    # Sort by score
    scored = [(r, r["overall_score"]) for r in all_rows]

    # Weighted sampling based on quality_bias
    weights = []
    for _, score in scored:
        # Higher bias → prefer higher scores
        w = (score / 10.0) ** (quality_bias * 3) if quality_bias > 0.5 else (1 - score / 10.0) ** ((1 - quality_bias) * 3)
        weights.append(max(0.01, w))

    # Weighted random sampling
    selected = []
    total_w = sum(weights)
    probs = [w / total_w for w in weights]

    for _ in range(n_rows):
        r = rng.random()
        cumulative = 0.0
        for i, p in enumerate(probs):
            cumulative += p
            if r <= cumulative:
                selected.append(scored[i][0])
                break
        else:
            selected.append(scored[-1][0])

    # Build dataset rows and compute average human score
    dataset_rows = []
    scores = []
    for row in selected:
        dataset_rows.append({
            "input": row.get("instruction", ""),
            "output": row.get("response", row.get("text", "")),
        })
        scores.append(row["overall_score"])

    avg_score = sum(scores) / len(scores) if scores else 5.0
    # Normalize 1-10 → 0-1 utility
    utility = max(0.01, min(0.99, (avg_score - 1.0) / 9.0))

    return dataset_rows, utility


def generate_real_training_data(
    n_samples: int = 150,
    seed: int = 42,
) -> List[Tuple[List[Dict], float, str]]:
    """Generate training data from UltraFeedback human scores.

    Creates mini-datasets by sampling with different quality biases,
    using the average human overall_score as the target utility.
    """
    print("  Loading UltraFeedback data...")
    all_rows = _load_ultrafeedback()
    print(f"  Loaded {len(all_rows)} scored rows")

    rng = random.Random(seed)
    data: List[Tuple[List[Dict], float, str]] = []

    # Generate samples across the quality spectrum
    for i in range(n_samples):
        quality_bias = rng.random()  # 0.0 to 1.0
        n_rows = rng.randint(20, 60)
        dataset_rows, utility = _sample_dataset_from_ultrafeedback(
            all_rows, n_rows, quality_bias, random.Random(seed + i),
        )

        # Assign tier based on utility
        if utility >= 0.85:
            tier = "excellent"
        elif utility >= 0.70:
            tier = "good"
        elif utility >= 0.50:
            tier = "fair"
        elif utility >= 0.30:
            tier = "poor"
        else:
            tier = "unusable"

        data.append((dataset_rows, utility, tier))

    rng.shuffle(data)
    return data


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    use_real = "--real-data" in sys.argv

    print("=" * 60)
    print(f"Verifily Quality Predictor — Training ({'REAL DATA' if use_real else 'synthetic'})")
    print("=" * 60)

    # 1. Generate data
    if use_real:
        print("\n1. Sampling datasets from UltraFeedback (real human scores)...")
        data = generate_real_training_data(n_samples=150, seed=42)
    else:
        print("\n1. Generating synthetic training data...")
        data = generate_training_data(n_per_tier=30, seed=42)
    tier_counts = {}
    for _, _, t in data:
        tier_counts[t] = tier_counts.get(t, 0) + 1
    print(f"   Generated {len(data)} labeled datasets: {tier_counts}")

    # 2. Extract features
    print("\n2. Extracting 30-dim feature vectors...")
    X, y, tiers = extract_all_features(data)
    print(f"   Feature matrix: {len(X)} x {len(X[0])} dims")

    # 3. Check for sklearn
    try:
        import sklearn  # noqa: F401
        has_sklearn = True
    except ImportError:
        has_sklearn = False

    output_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "verifily_cli_v1", "core", "predictor_weights.json",
    )

    if has_sklearn:
        # 3a. Cross-validate
        print("\n3. Cross-validating with Ridge regression (5-fold)...")
        r2_mean, r2_std = cross_validate(X, y, n_folds=5, alpha=1.0)
        print(f"   R² = {r2_mean:.4f} ± {r2_std:.4f}")

        # 3b. Train on full data
        print("\n4. Training final model on full data...")
        weights, intercept, means, scales = train_ridge(X, y, alpha=1.0)

        # 3c. Training accuracy
        print("\n5. Evaluating on training data...")
        from sklearn.preprocessing import StandardScaler
        import numpy as np
        X_arr = np.array(X)
        scaler = StandardScaler()
        scaler.mean_ = np.array(means)
        scaler.scale_ = np.array(scales)
        scaler.var_ = scaler.scale_ ** 2
        scaler.n_features_in_ = len(means)
        X_scaled = scaler.transform(X_arr)

        predictions = X_scaled @ np.array(weights) + intercept
        ss_res = np.sum((np.array(y) - predictions) ** 2)
        ss_tot = np.sum((np.array(y) - np.mean(y)) ** 2)
        train_r2 = 1 - ss_res / ss_tot
        print(f"   Training R² = {train_r2:.4f}")

        # Tier accuracy
        correct = 0
        for i in range(len(y)):
            pred_util = max(0, min(1, predictions[i]))
            if pred_util >= 0.85:
                pred_tier = "excellent"
            elif pred_util >= 0.70:
                pred_tier = "good"
            elif pred_util >= 0.50:
                pred_tier = "fair"
            elif pred_util >= 0.30:
                pred_tier = "poor"
            else:
                pred_tier = "unusable"
            if pred_tier == tiers[i]:
                correct += 1
        print(f"   Tier accuracy = {correct}/{len(y)} ({correct/len(y):.1%})")

        # 4. Export
        print("\n6. Exporting weights...")
        export_weights(weights, intercept, means, scales, r2_mean, r2_std, output_path)

    else:
        # Fallback: pure Python
        print("\n3. sklearn not available, using pure Python gradient descent...")
        weights = train_pure_python(X, y, lr=0.005, epochs=5000)

        # Export without scaler
        payload = {
            "version": 1,
            "model": "linear_gd",
            "n_features": len(weights),
            "weights": [round(w, 8) for w in weights],
            "intercept": 0.0,
            "scaler_means": [],
            "scaler_scales": [],
            "cross_val_r2_mean": 0.0,
            "cross_val_r2_std": 0.0,
        }
        with open(output_path, "w") as f:
            json.dump(payload, f, indent=2)
        print(f"\n  Exported to {output_path}")

    print("\n" + "=" * 60)
    print("Done. Predictor weights saved.")
    print("=" * 60)


if __name__ == "__main__":
    main()
