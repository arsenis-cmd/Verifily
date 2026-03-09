"""Tests for verifily_cli_v1.core.ml_backends."""

from __future__ import annotations

import pytest

from verifily_cli_v1.core.ml_backends import (
    MLBackends,
    get_ml_backends,
    ml_available,
)

_SKIP = not ml_available()
_REASON = "ML dependencies not installed"


# ---------------------------------------------------------------------------
# Availability & singleton
# ---------------------------------------------------------------------------

class TestAvailability:
    def test_ml_available_returns_bool(self):
        assert isinstance(ml_available(), bool)

    def test_singleton_pattern(self):
        a = get_ml_backends()
        b = get_ml_backends()
        assert a is b

    def test_reset_creates_new_instance(self):
        a = get_ml_backends()
        MLBackends.reset()
        b = get_ml_backends()
        assert a is not b
        # Restore singleton for other tests
        MLBackends.reset()


# ---------------------------------------------------------------------------
# Sentence embeddings
# ---------------------------------------------------------------------------

@pytest.mark.skipif(_SKIP, reason=_REASON)
class TestEmbedSentences:
    def test_returns_list_of_lists(self):
        ml = get_ml_backends()
        vecs = ml.embed_sentences(["hello world", "test sentence"])
        assert isinstance(vecs, list)
        assert len(vecs) == 2
        assert isinstance(vecs[0], list)

    def test_embedding_dimension(self):
        ml = get_ml_backends()
        vecs = ml.embed_sentences(["hello world"])
        # all-MiniLM-L6-v2 produces 384-dim vectors
        assert len(vecs[0]) == 384

    def test_embeddings_are_normalized(self):
        ml = get_ml_backends()
        vecs = ml.embed_sentences(["hello world"])
        norm = sum(x * x for x in vecs[0]) ** 0.5
        assert abs(norm - 1.0) < 0.01

    def test_similar_texts_higher_cosine(self):
        ml = get_ml_backends()
        vecs = ml.embed_sentences([
            "machine learning neural networks deep learning",
            "artificial intelligence model training optimization",
            "cooking pasta with tomato sauce and basil",
        ])
        sim_related = sum(a * b for a, b in zip(vecs[0], vecs[1]))
        sim_unrelated = sum(a * b for a, b in zip(vecs[0], vecs[2]))
        assert sim_related > sim_unrelated

    def test_empty_string_handled(self):
        ml = get_ml_backends()
        vecs = ml.embed_sentences(["", "hello"])
        assert len(vecs) == 2

    def test_single_text(self):
        ml = get_ml_backends()
        vecs = ml.embed_sentences(["just one sentence here"])
        assert len(vecs) == 1


# ---------------------------------------------------------------------------
# Toxicity scoring
# ---------------------------------------------------------------------------

@pytest.mark.skipif(_SKIP, reason=_REASON)
class TestToxicityScoring:
    def test_safe_text_low_toxicity(self):
        ml = get_ml_backends()
        scores = ml.score_toxicity(["The weather is nice today."])
        assert scores is not None
        assert len(scores) == 1
        assert scores[0] < 0.5  # should be clearly non-toxic

    def test_toxic_text_high_toxicity(self):
        ml = get_ml_backends()
        scores = ml.score_toxicity(["You are an absolute idiot and I hate you."])
        assert scores is not None
        assert scores[0] > 0.5  # should flag as toxic

    def test_multiple_texts(self):
        ml = get_ml_backends()
        scores = ml.score_toxicity([
            "Have a wonderful day!",
            "This is great work.",
        ])
        assert len(scores) == 2
        assert all(0.0 <= s <= 1.0 for s in scores)

    def test_empty_text_handled(self):
        ml = get_ml_backends()
        scores = ml.score_toxicity([""])
        assert scores is not None
        assert len(scores) == 1


# ---------------------------------------------------------------------------
# Domain classification
# ---------------------------------------------------------------------------

@pytest.mark.skipif(_SKIP, reason=_REASON)
class TestDomainClassification:
    def test_classify_code(self):
        ml = get_ml_backends()
        texts = [
            "def hello(): print('world')",
            "import os; os.path.join('a', 'b')",
            "class Foo: def bar(self): return 42",
            "for i in range(10): sum += i",
            "function getData() { return fetch('/api').then(r => r.json()); }",
        ] * 5
        result = ml.classify_domain(texts)
        assert result is not None
        domain, conf = result
        assert domain == "code"
        assert conf > 0.3

    def test_classify_medical(self):
        ml = get_ml_backends()
        texts = [
            "The patient was diagnosed with bilateral pneumonia and placed on IV antibiotics.",
            "Lab results showed elevated troponin levels consistent with cardiac ischemia.",
            "Colonoscopy revealed a 2cm polyp in the ascending colon requiring biopsy.",
            "Prescribed amoxicillin 500mg three times daily for 10 days for streptococcal pharyngitis.",
            "Post-surgical wound healing is progressing well with no signs of infection.",
        ] * 5
        result = ml.classify_domain(texts)
        assert result is not None
        domain, conf = result
        assert domain == "medical"

    def test_returns_tuple(self):
        ml = get_ml_backends()
        result = ml.classify_domain(["hello world"] * 10)
        assert result is not None
        domain, conf = result
        assert isinstance(domain, str)
        assert isinstance(conf, float)
        assert 0.0 <= conf <= 1.0

    def test_empty_returns_general(self):
        ml = get_ml_backends()
        result = ml.classify_domain([])
        assert result is not None
        assert result[0] == "general"
