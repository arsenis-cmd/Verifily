"""Central ML service layer for Verifily.

Provides lazy-loading, cached, thread-safe access to ML models:
- Sentence embeddings (sentence-transformers all-MiniLM-L6-v2)
- Toxicity classification (unitary/toxic-bert)
- Domain classification (embedding centroid matching + BART-large-MNLI zero-shot)
- Perplexity scoring (distilgpt2 for formatting/fluency quality)
- Multi-axis quality scoring (fine-tuned deberta-v3-large ensemble on 117k human annotations)

All methods return None when ML dependencies are unavailable,
allowing callers to fall back to heuristics.
"""

from __future__ import annotations

import math
import os
import threading
from typing import Any, Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Availability checks
# ---------------------------------------------------------------------------

def _has_sentence_transformers() -> bool:
    try:
        from sentence_transformers import SentenceTransformer  # noqa: F401
        return True
    except ImportError:
        return False


def _has_torch() -> bool:
    try:
        import torch  # noqa: F401
        return True
    except ImportError:
        return False


def _has_transformers_pipeline() -> bool:
    try:
        from transformers import pipeline  # noqa: F401
        return True
    except ImportError:
        return False


def ml_available() -> bool:
    """True if real ML backends are usable (torch + sentence-transformers)."""
    import os
    if os.environ.get("VERIFILY_NO_ML", "").strip() == "1":
        return False
    return _has_torch() and _has_sentence_transformers()


# ---------------------------------------------------------------------------
# Domain exemplars (short representative texts per domain)
# ---------------------------------------------------------------------------

_DOMAIN_EXEMPLARS: Dict[str, List[str]] = {
    "code": [
        "def calculate_sum(a, b): return a + b",
        "class UserModel: def __init__(self): self.name = ''",
        "import numpy as np; arr = np.array([1, 2, 3])",
        "function fetchData(url) { return fetch(url).then(r => r.json()); }",
        "SELECT id, name FROM users WHERE active = 1 ORDER BY created_at",
    ],
    "medical": [
        "Patient presents with acute myocardial infarction requiring immediate intervention.",
        "Diagnosis of type 2 diabetes mellitus with comorbid hypertension and dyslipidemia.",
        "Prescribed metformin 500mg twice daily with periodic HbA1c monitoring.",
        "MRI findings consistent with lumbar disc herniation at L4-L5 level.",
        "Post-operative recovery following laparoscopic cholecystectomy was uneventful.",
    ],
    "legal": [
        "Pursuant to Section 4(a) of the Agreement, the parties shall indemnify and hold harmless.",
        "The defendant filed a motion to dismiss citing lack of personal jurisdiction.",
        "This contract shall be governed by the laws of the State of Delaware.",
        "The court hereby grants summary judgment in favor of the plaintiff.",
        "Notwithstanding any provision to the contrary, force majeure events shall excuse performance.",
    ],
    "conversational": [
        "Hey, how can I help you today? Let me know what you need.",
        "Thanks for reaching out! I'd be happy to assist with your question.",
        "Could you please provide more details about the issue you're experiencing?",
        "Sure, I understand your concern. Here's what I suggest we try first.",
        "Is there anything else I can help you with before we wrap up?",
    ],
    "instruction": [
        "Explain the process of photosynthesis in plants step by step.",
        "Write a Python function that implements binary search on a sorted array.",
        "Summarize the key events of World War II in chronological order.",
        "Describe the differences between TCP and UDP protocols.",
        "Create a detailed recipe for making traditional Italian carbonara pasta.",
    ],
}


# ---------------------------------------------------------------------------
# MLBackends singleton
# ---------------------------------------------------------------------------

class MLBackends:
    """Lazy-loading singleton for all ML models.

    Models are loaded on first use and cached for the process lifetime.
    Thread-safe via simple locking.
    """

    _instance: Optional["MLBackends"] = None

    def __new__(cls) -> "MLBackends":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True
        self._sbert_model: Any = None
        self._toxicity_pipeline: Any = None
        self._domain_centroids: Optional[Dict[str, List[float]]] = None
        self._perplexity_model: Any = None
        self._perplexity_tokenizer: Any = None
        self._quality_head: Any = None
        self._quality_head_meta: Optional[Dict] = None
        self._quality_tokenizer: Any = None
        self._zeroshot_pipeline: Any = None
        self._lock = threading.Lock()

    @classmethod
    def reset(cls) -> None:
        """Reset singleton (for testing)."""
        cls._instance = None

    # ── Sentence embeddings ───────────────────────────────────

    def embed_sentences(
        self,
        texts: List[str],
        batch_size: int = 64,
    ) -> Optional[List[List[float]]]:
        """Embed texts using sentence-transformers (all-MiniLM-L6-v2).

        Returns L2-normalized 384-dim dense vectors, or None if unavailable.
        """
        if not _has_sentence_transformers():
            return None

        with self._lock:
            if self._sbert_model is None:
                from sentence_transformers import SentenceTransformer
                self._sbert_model = SentenceTransformer("all-MiniLM-L6-v2")

        embeddings = self._sbert_model.encode(
            texts,
            batch_size=batch_size,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return [emb.tolist() for emb in embeddings]

    # ── Toxicity scoring ──────────────────────────────────────

    def score_toxicity(
        self,
        texts: List[str],
        batch_size: int = 32,
    ) -> Optional[List[float]]:
        """Score toxicity probability (0=safe, 1=toxic) using toxic-bert.

        Returns per-text toxicity scores, or None if unavailable.
        """
        if not _has_transformers_pipeline():
            return None

        with self._lock:
            if self._toxicity_pipeline is None:
                from transformers import pipeline
                self._toxicity_pipeline = pipeline(
                    "text-classification",
                    model="unitary/toxic-bert",
                    truncation=True,
                    max_length=512,
                )

        scores: List[float] = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            # Replace empty/whitespace-only strings to avoid pipeline errors
            batch = [t if t.strip() else "empty" for t in batch]
            results = self._toxicity_pipeline(batch)
            for r in results:
                if r["label"] == "toxic":
                    scores.append(r["score"])
                else:
                    scores.append(1.0 - r["score"])
        return scores

    # ── Perplexity scoring (distilgpt2) ─────────────────────────

    def score_perplexity(
        self,
        texts: List[str],
        batch_size: int = 8,
        max_length: int = 256,
    ) -> Optional[List[float]]:
        """Score text fluency using distilgpt2 perplexity.

        Returns per-text scores normalized to 0-1 (1 = very fluent, 0 = garbled).
        Lower perplexity maps to higher fluency score.
        """
        if not _has_torch() or not _has_transformers_pipeline():
            return None

        import torch

        with self._lock:
            if self._perplexity_model is None:
                from transformers import AutoModelForCausalLM, AutoTokenizer
                self._perplexity_tokenizer = AutoTokenizer.from_pretrained("distilgpt2")
                self._perplexity_model = AutoModelForCausalLM.from_pretrained("distilgpt2")
                self._perplexity_model.eval()
                if self._perplexity_tokenizer.pad_token is None:
                    self._perplexity_tokenizer.pad_token = self._perplexity_tokenizer.eos_token

        scores: List[float] = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch = [t.strip()[:1000] if t.strip() else "empty text" for t in batch]

            with torch.no_grad():
                for text in batch:
                    tokens = self._perplexity_tokenizer(
                        text,
                        return_tensors="pt",
                        truncation=True,
                        max_length=max_length,
                    )
                    input_ids = tokens["input_ids"]
                    if input_ids.shape[1] < 2:
                        scores.append(0.0)
                        continue

                    outputs = self._perplexity_model(input_ids, labels=input_ids)
                    loss = outputs.loss.item()
                    ppl = math.exp(min(loss, 20.0))  # cap at exp(20) ≈ 485M

                    # Map perplexity to 0-1 fluency score
                    # PPL < 50 → excellent (>0.8), PPL 50-200 → good (0.5-0.8),
                    # PPL 200-1000 → poor (0.2-0.5), PPL > 1000 → garbled (<0.2)
                    fluency = 1.0 / (1.0 + math.log1p(ppl) / 10.0)
                    scores.append(max(0.0, min(1.0, fluency)))

        return scores

    # ── Multi-axis quality scoring (fine-tuned deberta-v3-large ensemble) ────

    def score_quality_axes(
        self,
        texts: List[str],
        batch_size: int = 16,
    ) -> Optional[Dict[str, List[float]]]:
        """Score texts on 4 quality axes using fine-tuned deberta model.

        Returns {"coherence": [...], "informativeness": [...],
                 "complexity": [...], "overall": [...]} or None.

        Fine-tuned end-to-end on 117k combined human annotations
        (HelpSteer2 + UltraFeedback + oasst2) with missing-label masking.
        v7: 3-model ensemble of deberta-v3-large, Huber loss, data cleaning.
        """
        if not _has_torch():
            return None

        import json
        import torch
        import torch.nn as nn

        # Try fine-tuned model first (v3.1+)
        model_dir = os.path.join(os.path.dirname(__file__), "quality_model")
        meta_path = os.path.join(model_dir, "quality_meta.json")

        if os.path.exists(meta_path):
            # Check if at least one model file exists
            with open(meta_path) as f:
                meta = json.load(f)
            if meta.get("ensemble", False):
                model_files = meta.get("model_files", [])
                has_model = any(
                    os.path.exists(os.path.join(model_dir, mf))
                    for mf in model_files
                )
            else:
                has_model = os.path.exists(os.path.join(model_dir, "model.pt"))

            if has_model:
                return self._score_quality_finetuned(texts, batch_size)

        # Fall back to old frozen-embedding head (v3.0)
        return self._score_quality_head_legacy(texts, batch_size)

    def _score_quality_finetuned(
        self,
        texts: List[str],
        batch_size: int = 16,
    ) -> Optional[Dict[str, List[float]]]:
        """Score using fine-tuned deberta quality model (v4/v5/v6/v7).

        Supports both single-model and ensemble modes:
        - Single model (v4/v5/v6): loads model.pt, runs inference
        - Ensemble (v7+): loads multiple model files, averages predictions
        """
        import torch
        import torch.nn as nn

        model_dir = os.path.join(os.path.dirname(__file__), "quality_model")
        meta_path = os.path.join(model_dir, "quality_meta.json")

        with self._lock:
            if self._quality_head is None:
                import json
                from transformers import AutoModel, AutoTokenizer

                with open(meta_path) as f:
                    self._quality_head_meta = json.load(f)

                meta = self._quality_head_meta
                base_model_name = meta.get("base_model", "microsoft/deberta-base")
                hidden_size = meta.get("hidden_size", 768)
                num_axes = meta.get("num_axes", 4)
                head_hidden = meta.get("head_hidden")  # v5+ expanded head
                head_dropout = meta.get("head_dropout", 0.15)
                head_type = meta.get("head_type")  # v6: "per_axis"
                is_ensemble = meta.get("ensemble", False)

                # Load tokenizer from saved directory
                self._quality_tokenizer = AutoTokenizer.from_pretrained(model_dir)

                # Build model architecture
                class _QualityModel(nn.Module):
                    def __init__(self, base_model, hs, na, hh=None, hd=0.15,
                                 ht=None):
                        super().__init__()
                        self.base = base_model
                        self.dropout = nn.Dropout(0.1)
                        if ht == "per_axis":
                            # v6: independent head per axis
                            _hh = hh or 256
                            self.heads = nn.ModuleList([
                                nn.Sequential(
                                    nn.Linear(hs, _hh),
                                    nn.GELU(),
                                    nn.Dropout(hd),
                                    nn.Linear(_hh, 1),
                                )
                                for _ in range(na)
                            ])
                            self.head = None
                        elif hh is not None:
                            # v5/v7 shared expanded head
                            self.head = nn.Sequential(
                                nn.Linear(hs, hh),
                                nn.GELU(),
                                nn.Dropout(hd),
                                nn.Linear(hh, na),
                            )
                            self.heads = None
                        else:
                            # v4 simple head
                            self.head = nn.Linear(hs, na)
                            self.heads = None
                        self.sigmoid = nn.Sigmoid()

                    def forward(self, input_ids, attention_mask):
                        outputs = self.base(input_ids=input_ids, attention_mask=attention_mask)
                        cls = self.dropout(outputs.last_hidden_state[:, 0])
                        if self.heads is not None:
                            out = torch.cat([h(cls) for h in self.heads], dim=1)
                        else:
                            out = self.head(cls)
                        return self.sigmoid(out)

                if is_ensemble:
                    # v7+: load each model independently
                    model_files = meta.get("model_files", ["model.pt"])
                    models = []
                    for model_file in model_files:
                        base = AutoModel.from_pretrained(base_model_name)
                        model = _QualityModel(base, hidden_size, num_axes,
                                              head_hidden, head_dropout, head_type)
                        model_path = os.path.join(model_dir, model_file)
                        model.load_state_dict(
                            torch.load(model_path, map_location="cpu", weights_only=True)
                        )
                        model.eval()
                        models.append(model)
                    self._quality_head = models  # list of models
                else:
                    # Single model (v4/v5/v6)
                    model_path = os.path.join(model_dir, "model.pt")
                    base = AutoModel.from_pretrained(base_model_name)
                    model = _QualityModel(base, hidden_size, num_axes,
                                          head_hidden, head_dropout, head_type)
                    model.load_state_dict(
                        torch.load(model_path, map_location="cpu", weights_only=True)
                    )
                    model.eval()
                    self._quality_head = model

        max_length = self._quality_head_meta.get("max_seq_length", 256)
        axes = self._quality_head_meta.get("output_axes",
                                            ["coherence", "informativeness", "complexity", "overall"])
        is_ensemble = self._quality_head_meta.get("ensemble", False)

        result: Dict[str, List[float]] = {ax: [] for ax in axes}

        with torch.no_grad():
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                batch = [t if t.strip() else "empty" for t in batch]

                encoding = self._quality_tokenizer(
                    batch,
                    truncation=True,
                    max_length=max_length,
                    padding=True,
                    return_tensors="pt",
                )

                input_ids = encoding["input_ids"]
                attention_mask = encoding["attention_mask"]

                if is_ensemble:
                    # Average predictions across all ensemble members
                    all_preds = [
                        m(input_ids, attention_mask)
                        for m in self._quality_head
                    ]
                    preds = torch.stack(all_preds).mean(dim=0).numpy()
                else:
                    preds = self._quality_head(
                        input_ids, attention_mask,
                    ).numpy()

                for j in range(len(batch)):
                    for ax_idx, ax in enumerate(axes):
                        result[ax].append(float(preds[j][ax_idx]))

        return result

    def _score_quality_head_legacy(
        self,
        texts: List[str],
        batch_size: int = 64,
    ) -> Optional[Dict[str, List[float]]]:
        """Fall back to old frozen-embedding + MLP head (v3.0 compat)."""
        if not _has_sentence_transformers():
            return None

        import torch
        import torch.nn as nn

        model_path = os.path.join(os.path.dirname(__file__), "quality_head.pt")
        meta_path = os.path.join(os.path.dirname(__file__), "quality_head_meta.json")

        if not os.path.exists(model_path) or not os.path.exists(meta_path):
            return None

        with self._lock:
            if self._quality_head is None:
                import json
                with open(meta_path) as f:
                    self._quality_head_meta = json.load(f)

                meta = self._quality_head_meta
                input_dim = meta.get("input_dim", 384)
                hidden_dim = meta.get("hidden_dim", 128)
                output_dim = meta.get("output_dim", 4)

                model = nn.Sequential(
                    nn.Linear(input_dim, hidden_dim),
                    nn.ReLU(),
                    nn.Dropout(0.05),
                    nn.Linear(hidden_dim, output_dim),
                    nn.Sigmoid(),
                )
                model.load_state_dict(torch.load(model_path, map_location="cpu", weights_only=True))
                model.eval()
                self._quality_head = model

        embeddings = self.embed_sentences(texts, batch_size=batch_size)
        if embeddings is None:
            return None

        with torch.no_grad():
            X = torch.tensor(embeddings, dtype=torch.float32)
            preds = self._quality_head(X).numpy()

        axes = self._quality_head_meta.get("output_axes",
                                            ["coherence", "informativeness", "complexity", "overall"])
        result: Dict[str, List[float]] = {}
        for i, ax in enumerate(axes):
            result[ax] = [float(preds[j][i]) for j in range(len(texts))]

        return result

    def get_quality_meta(self) -> Optional[Dict]:
        """Return quality model metadata (for axis R² thresholds)."""
        model_dir = os.path.join(os.path.dirname(__file__), "quality_model")
        meta_path = os.path.join(model_dir, "quality_meta.json")

        if not os.path.exists(meta_path):
            # Try legacy
            legacy_path = os.path.join(os.path.dirname(__file__), "quality_head_meta.json")
            if os.path.exists(legacy_path):
                import json
                with open(legacy_path) as f:
                    return json.load(f)
            return None

        import json
        with open(meta_path) as f:
            return json.load(f)

    # ── Zero-shot domain classification (BART-large-MNLI) ─────

    def classify_domain_zeroshot(
        self,
        texts: List[str],
        sample_size: int = 100,
    ) -> Optional[Tuple[str, float]]:
        """Classify dataset domain using zero-shot NLI (BART-large-MNLI).

        Returns (domain_name, confidence) or None if unavailable.
        Much more accurate than centroid matching — uses real NLI reasoning.
        """
        if not _has_transformers_pipeline():
            return None

        with self._lock:
            if self._zeroshot_pipeline is None:
                from transformers import pipeline
                self._zeroshot_pipeline = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli",
                )

        candidate_labels = [
            "code and programming",
            "medical and healthcare",
            "legal and law",
            "conversational dialogue",
            "instruction and education",
            "scientific research",
            "financial and business",
        ]

        # Label → short domain name
        label_map = {
            "code and programming": "code",
            "medical and healthcare": "medical",
            "legal and law": "legal",
            "conversational dialogue": "conversational",
            "instruction and education": "instruction",
            "scientific research": "scientific",
            "financial and business": "financial",
        }

        # Sample texts
        sample = [t for t in texts[:sample_size] if t.strip()]
        if not sample:
            return ("general", 0.5)

        # Classify a subsample and vote
        vote_texts = sample[:min(20, len(sample))]
        votes: Dict[str, float] = {}

        for text in vote_texts:
            truncated = text[:512]
            result = self._zeroshot_pipeline(
                truncated,
                candidate_labels=candidate_labels,
                multi_label=False,
            )
            top_label = result["labels"][0]
            top_score = result["scores"][0]
            domain = label_map.get(top_label, "general")
            votes[domain] = votes.get(domain, 0.0) + top_score

        if not votes:
            return ("general", 0.5)

        best_domain = max(votes, key=lambda k: votes[k])
        total_weight = sum(votes.values())
        confidence = votes[best_domain] / total_weight if total_weight > 0 else 0.5

        if confidence < 0.25:
            return ("general", 0.5)
        return (best_domain, round(confidence, 3))

    # ── Domain classification (centroid matching) ──────────────

    def classify_domain(
        self,
        texts: List[str],
        sample_size: int = 200,
    ) -> Optional[Tuple[str, float]]:
        """Classify dataset domain using embedding centroid matching.

        Returns (domain_name, confidence) or None if unavailable.
        """
        if not _has_sentence_transformers():
            return None

        self._ensure_domain_centroids()
        if self._domain_centroids is None:
            return None

        sample = texts[:sample_size]
        if not sample:
            return ("general", 0.8)

        embeddings = self.embed_sentences(sample)
        if embeddings is None:
            return None

        # Compute sample centroid (L2-normalized)
        dim = len(embeddings[0])
        centroid = [
            sum(e[d] for e in embeddings) / len(embeddings)
            for d in range(dim)
        ]
        norm = math.sqrt(sum(x * x for x in centroid))
        if norm > 0:
            centroid = [x / norm for x in centroid]

        # Compare against domain reference centroids
        best_domain = "general"
        best_sim = 0.0
        for domain, ref in self._domain_centroids.items():
            sim = sum(a * b for a, b in zip(centroid, ref))
            if sim > best_sim:
                best_sim = sim
                best_domain = domain

        confidence = min(1.0, max(0.0, best_sim))
        if confidence < 0.3:
            return ("general", 0.8)
        return (best_domain, round(confidence, 3))

    def _ensure_domain_centroids(self) -> None:
        """Lazily compute domain centroids from exemplar texts."""
        if self._domain_centroids is not None:
            return

        all_texts: List[str] = []
        domain_ranges: Dict[str, Tuple[int, int]] = {}
        offset = 0
        for domain, exemplars in _DOMAIN_EXEMPLARS.items():
            domain_ranges[domain] = (offset, offset + len(exemplars))
            all_texts.extend(exemplars)
            offset += len(exemplars)

        embeddings = self.embed_sentences(all_texts)
        if embeddings is None:
            return

        self._domain_centroids = {}
        for domain, (start, end) in domain_ranges.items():
            vecs = embeddings[start:end]
            dim = len(vecs[0])
            centroid = [
                sum(v[d] for v in vecs) / len(vecs)
                for d in range(dim)
            ]
            # L2 normalize
            norm = math.sqrt(sum(x * x for x in centroid))
            if norm > 0:
                centroid = [x / norm for x in centroid]
            self._domain_centroids[domain] = centroid


# ---------------------------------------------------------------------------
# Convenience
# ---------------------------------------------------------------------------

def get_ml_backends() -> MLBackends:
    """Get the MLBackends singleton."""
    return MLBackends()
