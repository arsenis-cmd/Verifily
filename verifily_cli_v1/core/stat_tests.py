"""Statistical hypothesis tests for drift detection.

Implementations of KS test, chi-squared test, Population Stability Index,
vocabulary drift, embedding centroid shift, and Classifier Two-Sample Test.

When ML is available, uses sentence-transformer dense embeddings for
semantic drift detection. Falls back to TF-IDF for all tests.
"""

from __future__ import annotations

import math
from collections import Counter
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional, Tuple

from verifily_cli_v1.core.tfidf import (
    SparseVector,
    TfidfVectorizer,
    cosine_similarity,
    tokenize,
)


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class StatTestResult:
    """Result of a statistical hypothesis test."""
    test_name: str
    feature_name: str
    statistic: float
    p_value: Optional[float]
    threshold: float
    drifted: bool
    severity: str       # "none", "minor", "major", "severe"
    detail: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _severity_from_stat(statistic: float, minor: float, major: float, severe: float) -> str:
    """Map a statistic to severity level."""
    if statistic >= severe:
        return "severe"
    elif statistic >= major:
        return "major"
    elif statistic >= minor:
        return "minor"
    return "none"


# ---------------------------------------------------------------------------
# Kolmogorov-Smirnov two-sample test
# ---------------------------------------------------------------------------

def ks_test(
    baseline: List[float],
    candidate: List[float],
    *,
    feature_name: str = "distribution",
    alpha: float = 0.05,
) -> StatTestResult:
    """Two-sample Kolmogorov-Smirnov test (pure Python).

    Compares the empirical CDFs of two samples.  Returns the D statistic
    and an approximate p-value using the asymptotic formula.

    Args:
        baseline: Sample from the baseline distribution.
        candidate: Sample from the candidate distribution.
        feature_name: Name for reporting.
        alpha: Significance level for the drifted flag.
    """
    n1 = len(baseline)
    n2 = len(candidate)

    if n1 == 0 or n2 == 0:
        return StatTestResult(
            test_name="ks_test",
            feature_name=feature_name,
            statistic=0.0,
            p_value=1.0,
            threshold=alpha,
            drifted=False,
            severity="none",
            detail="Empty sample(s), cannot compute KS test.",
        )

    # Merge and sort
    all_vals = sorted(
        [(v, 0) for v in baseline] + [(v, 1) for v in candidate]
    )

    cdf1 = 0.0
    cdf2 = 0.0
    d_max = 0.0

    for val, group in all_vals:
        if group == 0:
            cdf1 += 1.0 / n1
        else:
            cdf2 += 1.0 / n2
        d = abs(cdf1 - cdf2)
        if d > d_max:
            d_max = d

    # Approximate p-value (asymptotic)
    en = math.sqrt(n1 * n2 / (n1 + n2))
    lam = (en + 0.12 + 0.11 / en) * d_max

    # Kolmogorov distribution approximation (first few terms)
    if lam < 0.001:
        p_value = 1.0
    else:
        p_value = 0.0
        for k in range(1, 100):
            term = ((-1) ** (k - 1)) * math.exp(-2.0 * k * k * lam * lam)
            p_value += term
        p_value = max(0.0, min(1.0, 2.0 * p_value))

    severity = _severity_from_stat(d_max, 0.1, 0.2, 0.4)

    return StatTestResult(
        test_name="ks_test",
        feature_name=feature_name,
        statistic=round(d_max, 6),
        p_value=round(p_value, 6),
        threshold=alpha,
        drifted=p_value < alpha,
        severity=severity,
        detail=f"D={d_max:.4f}, p={p_value:.4f} (n1={n1}, n2={n2})",
    )


# ---------------------------------------------------------------------------
# Chi-squared test for categorical distributions
# ---------------------------------------------------------------------------

def chi_squared_test(
    baseline_counts: Dict[str, int],
    candidate_counts: Dict[str, int],
    *,
    feature_name: str = "categories",
    alpha: float = 0.05,
) -> StatTestResult:
    """Chi-squared test comparing two categorical distributions.

    Uses the baseline distribution as expected proportions and tests
    whether the candidate matches.
    """
    if not baseline_counts or not candidate_counts:
        return StatTestResult(
            test_name="chi_squared",
            feature_name=feature_name,
            statistic=0.0,
            p_value=1.0,
            threshold=alpha,
            drifted=False,
            severity="none",
            detail="Empty counts, cannot compute chi-squared.",
        )

    all_categories = set(baseline_counts.keys()) | set(candidate_counts.keys())
    baseline_total = sum(baseline_counts.values())
    candidate_total = sum(candidate_counts.values())

    if baseline_total == 0 or candidate_total == 0:
        return StatTestResult(
            test_name="chi_squared",
            feature_name=feature_name,
            statistic=0.0,
            p_value=1.0,
            threshold=alpha,
            drifted=False,
            severity="none",
            detail="Zero total counts.",
        )

    chi2 = 0.0
    df = max(1, len(all_categories) - 1)

    for cat in all_categories:
        observed = candidate_counts.get(cat, 0)
        # Expected = baseline proportion * candidate total
        baseline_prop = baseline_counts.get(cat, 0) / baseline_total
        expected = baseline_prop * candidate_total

        if expected > 0:
            chi2 += (observed - expected) ** 2 / expected
        elif observed > 0:
            chi2 += observed  # penalty for unexpected category

    # Approximate p-value using Wilson-Hilferty normal approximation
    p_value = _chi2_p_value(chi2, df)

    severity = _severity_from_stat(chi2 / max(1, df), 1.0, 3.0, 7.0)

    return StatTestResult(
        test_name="chi_squared",
        feature_name=feature_name,
        statistic=round(chi2, 4),
        p_value=round(p_value, 6),
        threshold=alpha,
        drifted=p_value < alpha,
        severity=severity,
        detail=f"χ²={chi2:.2f}, df={df}, p={p_value:.4f}",
    )


def _chi2_p_value(chi2: float, df: int) -> float:
    """Approximate chi-squared p-value using Wilson-Hilferty transform."""
    if df <= 0 or chi2 <= 0:
        return 1.0

    # Wilson-Hilferty approximation: transform to standard normal
    k = df
    z = ((chi2 / k) ** (1 / 3) - (1 - 2 / (9 * k))) / math.sqrt(2 / (9 * k))

    # Standard normal CDF approximation (Abramowitz & Stegun)
    return 1.0 - _normal_cdf(z)


def _normal_cdf(z: float) -> float:
    """Standard normal CDF approximation."""
    # Abramowitz & Stegun approximation 7.1.26
    if z < -8:
        return 0.0
    if z > 8:
        return 1.0

    p = 0.2316419
    b1, b2, b3, b4, b5 = 0.319381530, -0.356563782, 1.781477937, -1.821255978, 1.330274429

    a = abs(z)
    t = 1.0 / (1.0 + p * a)
    phi = math.exp(-0.5 * a * a) / math.sqrt(2 * math.pi)
    y = 1.0 - phi * (b1 * t + b2 * t**2 + b3 * t**3 + b4 * t**4 + b5 * t**5)

    if z < 0:
        return 1.0 - y
    return y


# ---------------------------------------------------------------------------
# Population Stability Index
# ---------------------------------------------------------------------------

def psi(
    baseline: List[float],
    candidate: List[float],
    *,
    feature_name: str = "distribution",
    buckets: int = 10,
) -> StatTestResult:
    """Population Stability Index (PSI).

    PSI < 0.1 → no significant shift
    PSI 0.1-0.25 → moderate shift
    PSI > 0.25 → significant shift

    Discretizes continuous values into equal-width buckets.
    """
    if not baseline or not candidate:
        return StatTestResult(
            test_name="psi",
            feature_name=feature_name,
            statistic=0.0,
            p_value=None,
            threshold=0.25,
            drifted=False,
            severity="none",
            detail="Empty sample(s).",
        )

    all_vals = baseline + candidate
    min_val = min(all_vals)
    max_val = max(all_vals)

    if min_val == max_val:
        return StatTestResult(
            test_name="psi",
            feature_name=feature_name,
            statistic=0.0,
            p_value=None,
            threshold=0.25,
            drifted=False,
            severity="none",
            detail="All values identical.",
        )

    # Create bucket edges
    step = (max_val - min_val) / buckets
    edges = [min_val + i * step for i in range(buckets + 1)]
    edges[-1] = max_val + 1e-10  # include max

    def _bucket_probs(values: List[float]) -> List[float]:
        counts = [0] * buckets
        for v in values:
            for b in range(buckets):
                if edges[b] <= v < edges[b + 1]:
                    counts[b] += 1
                    break
        total = len(values)
        # Smooth: replace 0 with small epsilon
        return [(c / total) if c > 0 else 1e-6 for c in counts]

    base_probs = _bucket_probs(baseline)
    cand_probs = _bucket_probs(candidate)

    psi_val = 0.0
    for bp, cp in zip(base_probs, cand_probs):
        psi_val += (cp - bp) * math.log(cp / bp)

    severity = _severity_from_stat(psi_val, 0.1, 0.25, 0.5)

    return StatTestResult(
        test_name="psi",
        feature_name=feature_name,
        statistic=round(psi_val, 6),
        p_value=None,
        threshold=0.25,
        drifted=psi_val >= 0.25,
        severity=severity,
        detail=f"PSI={psi_val:.4f} (buckets={buckets})",
    )


# ---------------------------------------------------------------------------
# Vocabulary drift
# ---------------------------------------------------------------------------

def vocabulary_drift(
    baseline_texts: List[str],
    candidate_texts: List[str],
    *,
    feature_name: str = "vocabulary",
    top_k: int = 1000,
) -> StatTestResult:
    """Vocabulary drift via Jaccard distance on top-K terms + new term rate.

    Returns a drift score 0-1 (higher = more drift).
    """
    if not baseline_texts or not candidate_texts:
        return StatTestResult(
            test_name="vocabulary_drift",
            feature_name=feature_name,
            statistic=0.0,
            p_value=None,
            threshold=0.3,
            drifted=False,
            severity="none",
            detail="Empty text sample(s).",
        )

    def _top_k_terms(texts: List[str], k: int) -> set:
        counts: Counter = Counter()
        for text in texts:
            counts.update(tokenize(text))
        return set(term for term, _ in counts.most_common(k))

    base_terms = _top_k_terms(baseline_texts, top_k)
    cand_terms = _top_k_terms(candidate_texts, top_k)

    if not base_terms and not cand_terms:
        return StatTestResult(
            test_name="vocabulary_drift",
            feature_name=feature_name,
            statistic=0.0,
            p_value=None,
            threshold=0.3,
            drifted=False,
            severity="none",
            detail="No vocabulary extracted.",
        )

    # Jaccard distance
    intersection = len(base_terms & cand_terms)
    union = len(base_terms | cand_terms)
    jaccard_dist = 1.0 - (intersection / union) if union > 0 else 1.0

    # New term rate: what fraction of candidate terms are new
    new_terms = cand_terms - base_terms
    new_rate = len(new_terms) / len(cand_terms) if cand_terms else 0.0

    # Combined score (weighted average)
    drift_score = 0.6 * jaccard_dist + 0.4 * new_rate

    severity = _severity_from_stat(drift_score, 0.15, 0.30, 0.50)

    return StatTestResult(
        test_name="vocabulary_drift",
        feature_name=feature_name,
        statistic=round(drift_score, 6),
        p_value=None,
        threshold=0.3,
        drifted=drift_score >= 0.3,
        severity=severity,
        detail=(
            f"Jaccard distance={jaccard_dist:.3f}, "
            f"new term rate={new_rate:.3f}, "
            f"combined={drift_score:.3f}"
        ),
    )


# ---------------------------------------------------------------------------
# Embedding centroid shift
# ---------------------------------------------------------------------------

def embedding_centroid_shift(
    baseline_vecs: List[SparseVector],
    candidate_vecs: List[SparseVector],
    *,
    feature_name: str = "semantic",
) -> StatTestResult:
    """Cosine distance between TF-IDF centroids of two datasets.

    Measures overall semantic shift.  Returns distance 0-1.
    """
    if not baseline_vecs or not candidate_vecs:
        return StatTestResult(
            test_name="embedding_centroid_shift",
            feature_name=feature_name,
            statistic=0.0,
            p_value=None,
            threshold=0.3,
            drifted=False,
            severity="none",
            detail="Empty vector set(s).",
        )

    def _centroid(vecs: List[SparseVector]) -> SparseVector:
        agg: Dict[str, float] = {}
        n = len(vecs)
        for v in vecs:
            for term, weight in v.items():
                agg[term] = agg.get(term, 0.0) + weight
        # Average
        for term in agg:
            agg[term] /= n
        # L2 normalize
        norm = math.sqrt(sum(w * w for w in agg.values()))
        if norm > 0:
            agg = {k: v / norm for k, v in agg.items()}
        return agg

    base_centroid = _centroid(baseline_vecs)
    cand_centroid = _centroid(candidate_vecs)

    similarity = cosine_similarity(base_centroid, cand_centroid)
    distance = 1.0 - similarity

    severity = _severity_from_stat(distance, 0.15, 0.30, 0.50)

    return StatTestResult(
        test_name="embedding_centroid_shift",
        feature_name=feature_name,
        statistic=round(distance, 6),
        p_value=None,
        threshold=0.3,
        drifted=distance >= 0.3,
        severity=severity,
        detail=f"Centroid cosine distance={distance:.4f}",
    )


# ---------------------------------------------------------------------------
# Dense embedding centroid shift (sentence-transformers)
# ---------------------------------------------------------------------------

def embedding_centroid_shift_dense(
    baseline_texts: List[str],
    candidate_texts: List[str],
    *,
    feature_name: str = "semantic_dense",
    sample_size: int = 500,
) -> Optional[StatTestResult]:
    """Cosine distance between sentence-transformer centroids.

    Uses dense 384-dim embeddings for much better semantic drift detection
    than TF-IDF centroids. Returns None if ML unavailable.
    """
    try:
        from verifily_cli_v1.core.ml_backends import get_ml_backends, ml_available
        if not ml_available():
            return None
        ml = get_ml_backends()
    except Exception:
        return None

    if not baseline_texts or not candidate_texts:
        return StatTestResult(
            test_name="embedding_centroid_shift_dense",
            feature_name=feature_name,
            statistic=0.0,
            p_value=None,
            threshold=0.3,
            drifted=False,
            severity="none",
            detail="Empty text sample(s).",
        )

    # Sample if too large
    base_sample = baseline_texts[:sample_size]
    cand_sample = candidate_texts[:sample_size]

    base_emb = ml.embed_sentences(base_sample)
    cand_emb = ml.embed_sentences(cand_sample)

    if base_emb is None or cand_emb is None:
        return None

    dim = len(base_emb[0])

    def _dense_centroid(embs: List[List[float]]) -> List[float]:
        n = len(embs)
        centroid = [sum(e[d] for e in embs) / n for d in range(dim)]
        norm = math.sqrt(sum(x * x for x in centroid))
        if norm > 0:
            centroid = [x / norm for x in centroid]
        return centroid

    base_c = _dense_centroid(base_emb)
    cand_c = _dense_centroid(cand_emb)

    similarity = sum(a * b for a, b in zip(base_c, cand_c))
    distance = max(0.0, 1.0 - similarity)

    severity = _severity_from_stat(distance, 0.10, 0.20, 0.40)

    return StatTestResult(
        test_name="embedding_centroid_shift_dense",
        feature_name=feature_name,
        statistic=round(distance, 6),
        p_value=None,
        threshold=0.2,
        drifted=distance >= 0.2,
        severity=severity,
        detail=f"Dense centroid cosine distance={distance:.4f} (384-dim sentence-transformers)",
    )


# ---------------------------------------------------------------------------
# Dense vocabulary drift (embedding-space comparison)
# ---------------------------------------------------------------------------

def vocabulary_drift_dense(
    baseline_texts: List[str],
    candidate_texts: List[str],
    *,
    feature_name: str = "vocabulary_dense",
    top_k: int = 200,
) -> Optional[StatTestResult]:
    """Vocabulary drift using embedded top-K term centroids.

    Instead of Jaccard on word sets, embeds top-K terms from each corpus
    and measures centroid distance. Captures "similar but different terminology"
    that word-level Jaccard misses.

    Returns None if ML unavailable.
    """
    try:
        from verifily_cli_v1.core.ml_backends import get_ml_backends, ml_available
        if not ml_available():
            return None
        ml = get_ml_backends()
    except Exception:
        return None

    if not baseline_texts or not candidate_texts:
        return StatTestResult(
            test_name="vocabulary_drift_dense",
            feature_name=feature_name,
            statistic=0.0,
            p_value=None,
            threshold=0.3,
            drifted=False,
            severity="none",
            detail="Empty text sample(s).",
        )

    def _top_terms(texts: List[str], k: int) -> List[str]:
        counts: Counter = Counter()
        for text in texts:
            counts.update(tokenize(text))
        return [term for term, _ in counts.most_common(k)]

    base_terms = _top_terms(baseline_texts, top_k)
    cand_terms = _top_terms(candidate_texts, top_k)

    if not base_terms or not cand_terms:
        return None

    # Embed the terms themselves
    all_terms = base_terms + cand_terms
    embeddings = ml.embed_sentences(all_terms)
    if embeddings is None:
        return None

    base_embs = embeddings[:len(base_terms)]
    cand_embs = embeddings[len(base_terms):]

    dim = len(base_embs[0])

    def _centroid(embs: List[List[float]]) -> List[float]:
        n = len(embs)
        c = [sum(e[d] for e in embs) / n for d in range(dim)]
        norm = math.sqrt(sum(x * x for x in c))
        if norm > 0:
            c = [x / norm for x in c]
        return c

    base_c = _centroid(base_embs)
    cand_c = _centroid(cand_embs)

    similarity = sum(a * b for a, b in zip(base_c, cand_c))
    distance = max(0.0, 1.0 - similarity)

    severity = _severity_from_stat(distance, 0.10, 0.25, 0.45)

    return StatTestResult(
        test_name="vocabulary_drift_dense",
        feature_name=feature_name,
        statistic=round(distance, 6),
        p_value=None,
        threshold=0.25,
        drifted=distance >= 0.25,
        severity=severity,
        detail=f"Dense vocabulary centroid distance={distance:.4f} (top {top_k} terms embedded)",
    )


# ---------------------------------------------------------------------------
# Classifier Two-Sample Test (C2ST)
# ---------------------------------------------------------------------------

def classifier_drift_test(
    baseline_texts: List[str],
    candidate_texts: List[str],
    *,
    feature_name: str = "classifier_drift",
    sample_size: int = 300,
    n_epochs: int = 50,
    lr: float = 0.01,
    test_fraction: float = 0.25,
    threshold: float = 0.55,
) -> Optional[StatTestResult]:
    """Classifier Two-Sample Test (C2ST) for distribution drift.

    Trains a logistic regression to distinguish embeddings from dataset A
    vs dataset B. If accuracy > threshold, the distributions are different.

    The classifier accuracy IS the drift statistic:
    - 0.50 = identical distributions (random chance)
    - 0.55+ = detectable drift
    - 1.00 = completely different distributions

    This is a genuine ML-based drift test used in production systems.
    Returns None if ML dependencies are unavailable.

    Args:
        baseline_texts: Texts from the baseline distribution.
        candidate_texts: Texts from the candidate distribution.
        feature_name: Name for reporting.
        sample_size: Max samples per dataset (to control compute).
        n_epochs: Training epochs for the classifier.
        lr: Learning rate.
        test_fraction: Fraction of data held out for evaluation.
        threshold: Accuracy above which drift is flagged.
    """
    try:
        import torch
        import torch.nn as nn
        from verifily_cli_v1.core.ml_backends import get_ml_backends, ml_available
        if not ml_available():
            return None
        ml = get_ml_backends()
    except Exception:
        return None

    if not baseline_texts or not candidate_texts:
        return StatTestResult(
            test_name="classifier_drift_test",
            feature_name=feature_name,
            statistic=0.5,
            p_value=None,
            threshold=threshold,
            drifted=False,
            severity="none",
            detail="Empty text sample(s).",
        )

    # Sample if too large
    import random as _rng
    rng = _rng.Random(42)

    base_sample = list(baseline_texts)
    if len(base_sample) > sample_size:
        base_sample = rng.sample(base_sample, sample_size)

    cand_sample = list(candidate_texts)
    if len(cand_sample) > sample_size:
        cand_sample = rng.sample(cand_sample, sample_size)

    # Get embeddings
    all_texts = base_sample + cand_sample
    embeddings = ml.embed_sentences(all_texts)
    if embeddings is None:
        return None

    n_base = len(base_sample)
    n_total = len(all_texts)
    dim = len(embeddings[0])

    # Create labeled dataset: 0 = baseline, 1 = candidate
    X = torch.tensor(embeddings, dtype=torch.float32)
    y = torch.tensor(
        [0.0] * n_base + [1.0] * (n_total - n_base),
        dtype=torch.float32,
    ).unsqueeze(1)

    # Shuffle and split
    indices = list(range(n_total))
    rng.shuffle(indices)
    n_test = max(2, int(n_total * test_fraction))
    test_idx = indices[:n_test]
    train_idx = indices[n_test:]

    X_train, y_train = X[train_idx], y[train_idx]
    X_test, y_test = X[test_idx], y[test_idx]

    # Train logistic regression
    classifier = nn.Linear(dim, 1)
    optimizer = torch.optim.SGD(classifier.parameters(), lr=lr, weight_decay=1e-4)
    loss_fn = nn.BCEWithLogitsLoss()

    classifier.train()
    for _ in range(n_epochs):
        optimizer.zero_grad()
        logits = classifier(X_train)
        loss = loss_fn(logits, y_train)
        loss.backward()
        optimizer.step()

    # Evaluate
    classifier.eval()
    with torch.no_grad():
        test_logits = classifier(X_test)
        test_preds = (test_logits > 0).float()
        accuracy = (test_preds == y_test).float().mean().item()

    drifted = accuracy > threshold
    severity = _severity_from_stat(accuracy, 0.55, 0.65, 0.80)

    return StatTestResult(
        test_name="classifier_drift_test",
        feature_name=feature_name,
        statistic=round(accuracy, 4),
        p_value=None,
        threshold=threshold,
        drifted=drifted,
        severity=severity,
        detail=(
            f"C2ST accuracy={accuracy:.4f} "
            f"(0.50=identical, 1.0=completely different, "
            f"n_train={len(train_idx)}, n_test={n_test})"
        ),
    )
