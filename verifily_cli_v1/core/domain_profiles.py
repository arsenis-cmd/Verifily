"""Domain-specific quality profiles for Verifily.

Pre-configured quality profiles for common ML data domains:
code, medical, legal, conversational, instruction, general.

Each profile adjusts scoring weights, enables domain-specific
checks, and calibrates thresholds.  Includes auto-detection.

Domain detection uses 3-tier fallback:
1. BART-large-MNLI zero-shot NLI classification (most accurate)
2. Sentence-transformer embedding centroid matching
3. Keyword/regex heuristics
"""

from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

from verifily_cli_v1.core.quality import QualityIssue


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class DomainCheck:
    """A domain-specific quality check."""
    name: str
    severity: str               # "error", "warning", "info"
    description: str
    check_fn: Callable[[List[str]], Optional[QualityIssue]]


@dataclass
class DomainProfile:
    """Quality profile for a specific data domain."""
    name: str
    description: str
    axis_weights: Dict[str, float]
    custom_checks: List[DomainCheck]
    thresholds: Dict[str, float]
    keywords: Set[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "axis_weights": self.axis_weights,
            "thresholds": self.thresholds,
        }


@dataclass
class DomainDetectionResult:
    """Result of domain auto-detection."""
    detected_domain: str
    confidence: float
    evidence: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "detected_domain": self.detected_domain,
            "confidence": round(self.confidence, 3),
            "evidence": self.evidence,
        }


# ---------------------------------------------------------------------------
# Domain-specific checks
# ---------------------------------------------------------------------------

_CODE_MARKERS = re.compile(
    r"(?:def |class |import |from \w+ import |if __name__|"
    r"function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|"
    r"#include|public\s+class|void\s+main|println!|fn\s+\w+)",
    re.MULTILINE,
)

_BRACKET_PAIRS = [("(", ")"), ("[", "]"), ("{", "}")]


def _check_code_syntax(texts: List[str]) -> Optional[QualityIssue]:
    """Check for syntax issues in code samples: unbalanced brackets,
    inconsistent indentation.
    """
    issues_count = 0
    sample_rows: List[int] = []

    for i, text in enumerate(texts):
        if not _CODE_MARKERS.search(text):
            continue
        for open_ch, close_ch in _BRACKET_PAIRS:
            if text.count(open_ch) != text.count(close_ch):
                issues_count += 1
                if len(sample_rows) < 5:
                    sample_rows.append(i)
                break

    if issues_count == 0:
        return None

    return QualityIssue(
        category="code_syntax",
        severity="warning",
        count=issues_count,
        fraction=issues_count / len(texts) if texts else 0.0,
        sample_rows=sample_rows,
        description=f"{issues_count} code samples have unbalanced brackets/parens",
    )


def _check_code_documentation(texts: List[str]) -> Optional[QualityIssue]:
    """Check for docstring/comment presence in code samples."""
    code_count = 0
    undocumented = 0
    sample_rows: List[int] = []

    doc_patterns = re.compile(
        r'(?:"""|\'\'\'|/\*\*|//|#\s+\w)',
        re.MULTILINE,
    )

    for i, text in enumerate(texts):
        if not _CODE_MARKERS.search(text):
            continue
        code_count += 1
        if not doc_patterns.search(text):
            undocumented += 1
            if len(sample_rows) < 5:
                sample_rows.append(i)

    if code_count == 0 or undocumented == 0:
        return None

    frac = undocumented / len(texts) if texts else 0.0
    if frac < 0.3:
        return None

    return QualityIssue(
        category="code_documentation",
        severity="info",
        count=undocumented,
        fraction=frac,
        sample_rows=sample_rows,
        description=f"{undocumented}/{code_count} code samples lack documentation",
    )


_MEDICAL_TERMS = {
    "diagnosis", "treatment", "patient", "clinical", "symptom", "symptoms",
    "disease", "therapy", "medication", "dose", "prognosis", "chronic",
    "acute", "pathology", "etiology", "comorbidity", "intervention",
    "adverse", "contraindication", "efficacy", "pharmacology",
    "hemoglobin", "leukocyte", "platelet", "cardiac", "renal",
    "hepatic", "pulmonary", "oncology", "radiology", "surgical",
}


def _check_medical_terminology(texts: List[str]) -> Optional[QualityIssue]:
    """Check medical term density for medical datasets.

    Flags if term density is suspiciously low for a medical dataset.
    """
    low_density_count = 0
    sample_rows: List[int] = []

    for i, text in enumerate(texts):
        words = set(text.lower().split())
        med_count = len(words & _MEDICAL_TERMS)
        density = med_count / max(1, len(words))
        if density < 0.01 and len(words) > 10:
            low_density_count += 1
            if len(sample_rows) < 5:
                sample_rows.append(i)

    if low_density_count == 0:
        return None

    frac = low_density_count / len(texts) if texts else 0.0
    if frac < 0.3:
        return None

    return QualityIssue(
        category="low_medical_terminology",
        severity="warning",
        count=low_density_count,
        fraction=frac,
        sample_rows=sample_rows,
        description=f"{low_density_count} rows have very low medical terminology density",
    )


_LEGAL_MARKERS = re.compile(
    r"(?:§\s*\d|Article\s+\d|Section\s+\d|pursuant\s+to|"
    r"hereinafter|notwithstanding|whereas|the\s+court\s+|"
    r"plaintiff|defendant|jurisdiction|statute|liability)",
    re.IGNORECASE,
)


def _check_legal_structure(texts: List[str]) -> Optional[QualityIssue]:
    """Check legal clause structure for legal datasets."""
    unstructured = 0
    sample_rows: List[int] = []

    for i, text in enumerate(texts):
        if not _LEGAL_MARKERS.search(text):
            continue
        # Check for overly long sentences (common in bad legal text)
        sents = re.split(r"[.!?]+", text)
        long_sents = sum(1 for s in sents if len(s.split()) > 80)
        if long_sents > len(sents) * 0.5 and len(sents) > 1:
            unstructured += 1
            if len(sample_rows) < 5:
                sample_rows.append(i)

    if unstructured == 0:
        return None

    return QualityIssue(
        category="legal_structure",
        severity="info",
        count=unstructured,
        fraction=unstructured / len(texts) if texts else 0.0,
        sample_rows=sample_rows,
        description=f"{unstructured} legal texts have overly long unstructured sentences",
    )


_INSTRUCTION_MARKERS = re.compile(
    r"(?:^(?:explain|describe|write|create|generate|list|summarize|"
    r"translate|convert|calculate|analyze|compare|evaluate|identify|"
    r"provide|given|how\s+(?:do|can|would|to)|what\s+(?:is|are))\b)",
    re.IGNORECASE | re.MULTILINE,
)


def _check_instruction_clarity(texts: List[str]) -> Optional[QualityIssue]:
    """Check instruction-response clarity for instruction datasets."""
    vague_count = 0
    sample_rows: List[int] = []

    for i, text in enumerate(texts):
        words = text.split()
        # Very short instructions are likely vague
        if len(words) < 5 and not _INSTRUCTION_MARKERS.search(text):
            vague_count += 1
            if len(sample_rows) < 5:
                sample_rows.append(i)

    if vague_count == 0:
        return None

    frac = vague_count / len(texts) if texts else 0.0
    if frac < 0.2:
        return None

    return QualityIssue(
        category="instruction_clarity",
        severity="warning",
        count=vague_count,
        fraction=frac,
        sample_rows=sample_rows,
        description=f"{vague_count} rows have vague or unclear instructions",
    )


_CONVERSATIONAL_MARKERS = re.compile(
    r"(?:^(?:hi|hello|hey|thanks|thank\s+you|please|sorry|"
    r"could\s+you|can\s+you|would\s+you|i\s+need|i\s+want|"
    r"help\s+me|tell\s+me|show\s+me)\b)",
    re.IGNORECASE | re.MULTILINE,
)


def _check_conversational_flow(texts: List[str]) -> Optional[QualityIssue]:
    """Check turn structure in conversational data."""
    broken_flow = 0
    sample_rows: List[int] = []

    for i, text in enumerate(texts):
        # Check for very short responses (single word/token)
        if len(text.split()) < 2 and len(text.strip()) > 0:
            broken_flow += 1
            if len(sample_rows) < 5:
                sample_rows.append(i)

    if broken_flow == 0:
        return None

    frac = broken_flow / len(texts) if texts else 0.0
    if frac < 0.15:
        return None

    return QualityIssue(
        category="conversational_flow",
        severity="info",
        count=broken_flow,
        fraction=frac,
        sample_rows=sample_rows,
        description=f"{broken_flow} conversational rows are extremely short (< 2 words)",
    )


# ---------------------------------------------------------------------------
# Domain detection
# ---------------------------------------------------------------------------

_DOMAIN_SIGNALS: Dict[str, Dict[str, Any]] = {
    "code": {
        "marker": _CODE_MARKERS,
        "keywords": {
            "function", "class", "import", "return", "def", "var",
            "const", "let", "void", "int", "string", "bool", "null",
            "true", "false", "for", "while", "if", "else", "try",
            "catch", "throw", "async", "await", "yield",
        },
        "structural": lambda text: (
            text.count("{") + text.count("}") + text.count("(") + text.count(")")
        ) / max(1, len(text)) > 0.02,
    },
    "medical": {
        "marker": re.compile(
            r"(?:patient|diagnosis|treatment|clinical|symptom|disease|"
            r"therapy|medication|pathology|prognosis)",
            re.IGNORECASE,
        ),
        "keywords": _MEDICAL_TERMS,
        "structural": lambda text: False,
    },
    "legal": {
        "marker": _LEGAL_MARKERS,
        "keywords": {
            "court", "law", "statute", "plaintiff", "defendant",
            "jurisdiction", "liability", "contract", "clause",
            "amendment", "regulation", "compliance", "verdict",
        },
        "structural": lambda text: False,
    },
    "conversational": {
        "marker": _CONVERSATIONAL_MARKERS,
        "keywords": {
            "hello", "thanks", "please", "sorry", "help", "tell",
            "explain", "sure", "okay", "yes", "no", "maybe",
            "agree", "disagree", "opinion", "think", "feel",
        },
        "structural": lambda text: text.count("?") / max(1, len(text.split())) > 0.1,
    },
    "instruction": {
        "marker": _INSTRUCTION_MARKERS,
        "keywords": {
            "explain", "describe", "write", "create", "generate",
            "list", "summarize", "translate", "convert", "calculate",
            "analyze", "compare", "evaluate", "identify", "provide",
        },
        "structural": lambda text: False,
    },
}


def detect_domain(texts: List[str], sample_size: int = 200) -> DomainDetectionResult:
    """Auto-detect dataset domain from content signals.

    3-tier detection:
    1. BART-large-MNLI zero-shot NLI (most accurate, ~1.6GB model)
    2. Sentence-transformer embedding centroid matching
    3. Keyword/regex heuristics
    """
    if not texts:
        return DomainDetectionResult(
            detected_domain="general",
            confidence=1.0,
            evidence=["Empty dataset"],
        )

    try:
        from verifily_cli_v1.core.ml_backends import get_ml_backends, ml_available
        if ml_available():
            ml = get_ml_backends()

            # Tier 1: Zero-shot NLI classification (BART-large-MNLI)
            try:
                zs_result = ml.classify_domain_zeroshot(texts, sample_size=sample_size)
                if zs_result is not None:
                    domain, confidence = zs_result
                    return DomainDetectionResult(
                        detected_domain=domain,
                        confidence=confidence,
                        evidence=[f"Zero-shot NLI classification (BART-large-MNLI, confidence: {confidence:.3f})"],
                    )
            except Exception:
                pass

            # Tier 2: Embedding centroid matching
            result = ml.classify_domain(texts, sample_size=sample_size)
            if result is not None:
                domain, confidence = result
                return DomainDetectionResult(
                    detected_domain=domain,
                    confidence=confidence,
                    evidence=[f"Embedding centroid classification (confidence: {confidence:.3f})"],
                )
    except Exception:
        pass  # fall through to heuristic

    # Heuristic detection (regex + keywords)
    sample = texts[:sample_size]
    n = len(sample)

    domain_scores: Dict[str, float] = {}
    domain_evidence: Dict[str, List[str]] = {}

    for domain, signals in _DOMAIN_SIGNALS.items():
        score = 0.0
        evidence: List[str] = []

        # Regex marker matches
        marker_count = sum(
            1 for text in sample if signals["marker"].search(text)
        )
        marker_frac = marker_count / n
        if marker_frac > 0.2:
            score += marker_frac * 2
            evidence.append(f"{marker_count}/{n} rows match {domain} markers")

        # Keyword frequency
        all_words: Counter = Counter()
        for text in sample:
            all_words.update(text.lower().split())
        total_words = sum(all_words.values())
        if total_words > 0:
            kw_hits = sum(
                all_words.get(kw, 0) for kw in signals["keywords"]
            )
            kw_density = kw_hits / total_words
            if kw_density > 0.005:
                score += kw_density * 50
                evidence.append(f"Keyword density: {kw_density:.3f}")

        # Structural patterns
        structural_count = sum(
            1 for text in sample if signals["structural"](text)
        )
        if structural_count > n * 0.2:
            score += 0.5
            evidence.append(f"{structural_count}/{n} match structural patterns")

        domain_scores[domain] = score
        domain_evidence[domain] = evidence

    # Pick highest-scoring domain
    if not domain_scores or max(domain_scores.values()) < 0.3:
        return DomainDetectionResult(
            detected_domain="general",
            confidence=0.8,
            evidence=["No strong domain signal detected"],
        )

    best_domain = max(domain_scores, key=domain_scores.get)  # type: ignore
    best_score = domain_scores[best_domain]

    # Confidence: how much better is top vs second
    sorted_scores = sorted(domain_scores.values(), reverse=True)
    if len(sorted_scores) > 1 and sorted_scores[0] > 0:
        margin = (sorted_scores[0] - sorted_scores[1]) / sorted_scores[0]
    else:
        margin = 1.0

    confidence = min(1.0, 0.5 + margin * 0.5)

    return DomainDetectionResult(
        detected_domain=best_domain,
        confidence=round(confidence, 3),
        evidence=domain_evidence.get(best_domain, []),
    )


# ---------------------------------------------------------------------------
# Profile registry
# ---------------------------------------------------------------------------

_PROFILES: Dict[str, DomainProfile] = {
    "code": DomainProfile(
        name="code",
        description="Source code and programming samples",
        axis_weights={
            "coherence": 0.10,
            "informativeness": 0.15,
            "complexity": 0.20,
            "safety": 0.10,
            "formatting": 0.30,
            "uniqueness": 0.15,
        },
        custom_checks=[
            DomainCheck("code_syntax", "warning", "Check bracket/paren balance", _check_code_syntax),
            DomainCheck("code_docs", "info", "Check documentation presence", _check_code_documentation),
        ],
        thresholds={"min_quality_score": 50, "min_formatting": 0.6},
        keywords={"function", "class", "import", "return", "def", "var"},
    ),
    "medical": DomainProfile(
        name="medical",
        description="Medical and clinical text data",
        axis_weights={
            "coherence": 0.20,
            "informativeness": 0.25,
            "complexity": 0.15,
            "safety": 0.20,
            "formatting": 0.10,
            "uniqueness": 0.10,
        },
        custom_checks=[
            DomainCheck("medical_terminology", "warning", "Check medical term density", _check_medical_terminology),
        ],
        thresholds={"min_quality_score": 60, "min_informativeness": 0.5},
        keywords=_MEDICAL_TERMS,
    ),
    "legal": DomainProfile(
        name="legal",
        description="Legal documents and contracts",
        axis_weights={
            "coherence": 0.20,
            "informativeness": 0.20,
            "complexity": 0.10,
            "safety": 0.15,
            "formatting": 0.20,
            "uniqueness": 0.15,
        },
        custom_checks=[
            DomainCheck("legal_structure", "info", "Check legal clause structure", _check_legal_structure),
        ],
        thresholds={"min_quality_score": 55, "min_coherence": 0.5},
        keywords={"court", "law", "statute", "plaintiff", "defendant"},
    ),
    "conversational": DomainProfile(
        name="conversational",
        description="Dialogue and chat data",
        axis_weights={
            "coherence": 0.25,
            "informativeness": 0.15,
            "complexity": 0.05,
            "safety": 0.25,
            "formatting": 0.10,
            "uniqueness": 0.20,
        },
        custom_checks=[
            DomainCheck("conversational_flow", "info", "Check turn structure", _check_conversational_flow),
        ],
        thresholds={"min_quality_score": 45, "min_safety": 0.7},
        keywords={"hello", "thanks", "please", "sorry", "help"},
    ),
    "instruction": DomainProfile(
        name="instruction",
        description="Instruction-following and task data",
        axis_weights={
            "coherence": 0.20,
            "informativeness": 0.20,
            "complexity": 0.15,
            "safety": 0.15,
            "formatting": 0.15,
            "uniqueness": 0.15,
        },
        custom_checks=[
            DomainCheck("instruction_clarity", "warning", "Check instruction clarity", _check_instruction_clarity),
        ],
        thresholds={"min_quality_score": 50, "min_coherence": 0.4},
        keywords={"explain", "describe", "write", "create", "generate"},
    ),
    "general": DomainProfile(
        name="general",
        description="General-purpose text data",
        axis_weights={
            "coherence": 0.17,
            "informativeness": 0.17,
            "complexity": 0.17,
            "safety": 0.17,
            "formatting": 0.16,
            "uniqueness": 0.16,
        },
        custom_checks=[],
        thresholds={"min_quality_score": 50},
        keywords=set(),
    ),
}


def get_profile(domain: str) -> DomainProfile:
    """Get a quality profile by domain name.

    Falls back to 'general' for unknown domains.
    """
    return _PROFILES.get(domain, _PROFILES["general"])


def list_profiles() -> List[str]:
    """List all available domain profile names."""
    return list(_PROFILES.keys())
