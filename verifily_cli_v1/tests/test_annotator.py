"""Tests for verifily_cli_v1.core.annotator — multi-axis quality annotation."""

import pytest

from verifily_cli_v1.core.annotator import (
    Annotator,
    DatasetAnnotation,
    RowAnnotation,
    _score_coherence,
    _score_complexity,
    _score_formatting,
    _score_informativeness,
    _score_safety,
    _score_uniqueness,
    _count_syllables,
    _AXES,
)


# ---------------------------------------------------------------------------
# Coherence
# ---------------------------------------------------------------------------

class TestCoherence:
    def test_single_sentence_returns_1(self):
        assert _score_coherence("The quick brown fox jumps over the lazy dog.") == 1.0

    def test_coherent_sentences_score_high(self):
        text = (
            "Machine learning models require quality training data. "
            "The quality of training data directly impacts model performance. "
            "Poor data quality leads to poor model outcomes."
        )
        assert _score_coherence(text) > 0.5

    def test_incoherent_sentences_score_lower(self):
        text = (
            "The weather in Paris is beautiful today. "
            "Quantum computing uses qubits for parallel processing. "
            "My favorite recipe involves chocolate and strawberries."
        )
        coherent = (
            "Machine learning models require quality data. "
            "Quality data improves machine learning model accuracy. "
            "Better data leads to better machine learning results."
        )
        assert _score_coherence(text) < _score_coherence(coherent)

    def test_empty_text_returns_1(self):
        assert _score_coherence("") == 1.0


# ---------------------------------------------------------------------------
# Informativeness
# ---------------------------------------------------------------------------

class TestInformativeness:
    def test_dense_text_scores_high(self):
        text = (
            "Transformer architectures revolutionized natural language "
            "processing through self-attention mechanisms enabling parallel "
            "computation across sequence positions, replacing recurrent "
            "neural network bottlenecks."
        )
        assert _score_informativeness(text) > 0.4

    def test_filler_text_scores_lower(self):
        filler = "basically actually really very just quite simply totally absolutely completely definitely certainly"
        dense = "Transformer self-attention mechanisms enable parallel computation across sequence positions"
        assert _score_informativeness(filler) < _score_informativeness(dense)

    def test_short_text_gets_default(self):
        assert _score_informativeness("hi") == 0.3

    def test_empty_content_words(self):
        # All stopwords
        assert _score_informativeness("the a an is are was were") == 0.0


# ---------------------------------------------------------------------------
# Complexity
# ---------------------------------------------------------------------------

class TestComplexity:
    def test_simple_text_low_score(self):
        assert _score_complexity("The cat sat on the mat.") < 0.3

    def test_academic_text_high_score(self):
        text = (
            "The epistemological foundations of contemporary hermeneutics "
            "necessitate a comprehensive reevaluation of methodological "
            "presuppositions underlying interpretive frameworks in "
            "phenomenological philosophical traditions."
        )
        assert _score_complexity(text) > 0.3

    def test_returns_0_to_1(self):
        for text in ["hi", "The cat.", "Very complex multi-syllable terminology text."]:
            score = _score_complexity(text)
            assert 0.0 <= score <= 1.0

    def test_syllable_counting(self):
        assert _count_syllables("cat") == 1
        assert _count_syllables("hello") == 2
        assert _count_syllables("university") >= 4


# ---------------------------------------------------------------------------
# Safety
# ---------------------------------------------------------------------------

class TestSafety:
    def test_clean_text_is_safe(self):
        assert _score_safety("The weather is nice today.") == 1.0

    def test_pii_lowers_score(self):
        text = "Contact john@example.com or call 555-123-4567"
        assert _score_safety(text) < 1.0

    def test_ssn_lowers_score(self):
        assert _score_safety("My SSN is 123-45-6789") < 1.0

    def test_multiple_pii_lower_penalty(self):
        single = _score_safety("Email: test@test.com")
        multi = _score_safety("Email: a@b.com and b@c.com and c@d.com")
        assert multi <= single

    def test_toxic_patterns(self):
        assert _score_safety("kill you and everyone") < 1.0

    def test_score_in_range(self):
        for text in ["clean text", "email@test.com", "123-45-6789"]:
            s = _score_safety(text)
            assert 0.0 <= s <= 1.0


# ---------------------------------------------------------------------------
# Formatting
# ---------------------------------------------------------------------------

class TestFormatting:
    def test_well_formatted_is_1(self):
        assert _score_formatting("Clean text with no issues.") == 1.0

    def test_unbalanced_brackets(self):
        assert _score_formatting("function(a, b {") < 1.0

    def test_encoding_artifacts(self):
        # Unicode replacement character
        assert _score_formatting("Caf\ufffd lat\ufffd") < 1.0

    def test_excessive_whitespace(self):
        assert _score_formatting("line1\n\n\nline2") < 1.0

    def test_score_in_range(self):
        for text in ["ok", "(((", "a\n\n\nb"]:
            s = _score_formatting(text)
            assert 0.0 <= s <= 1.0


# ---------------------------------------------------------------------------
# Uniqueness
# ---------------------------------------------------------------------------

class TestUniqueness:
    def test_unique_row_scores_high(self):
        from verifily_cli_v1.core.tfidf import TfidfVectorizer
        texts = [
            "Machine learning requires quality data for training models",
            "The ocean is vast and full of marine creatures",
            "Cooking Italian pasta requires fresh ingredients and patience",
        ]
        vecs = TfidfVectorizer(max_df_ratio=0.99).fit_transform(texts)
        for i in range(len(texts)):
            assert _score_uniqueness(i, vecs) > 0.3

    def test_duplicate_row_scores_low(self):
        from verifily_cli_v1.core.tfidf import TfidfVectorizer
        texts = [
            "Machine learning requires quality data for training",
            "Machine learning requires quality data for training",
            "The ocean is vast and full of marine creatures",
        ]
        vecs = TfidfVectorizer(max_df_ratio=0.99).fit_transform(texts)
        assert _score_uniqueness(0, vecs) < 0.3

    def test_single_row(self):
        from verifily_cli_v1.core.tfidf import TfidfVectorizer
        texts = [
            "Only one row here with enough words for vectorization",
            "A different row with completely separate content about cooking",
        ]
        vecs = TfidfVectorizer(max_df_ratio=0.99).fit_transform(texts)
        # With only 2 different rows, uniqueness should be reasonable
        assert _score_uniqueness(0, vecs) > 0.3


# ---------------------------------------------------------------------------
# Annotator (full dataset)
# ---------------------------------------------------------------------------

class TestAnnotator:
    def test_annotate_empty_dataset(self):
        ann = Annotator()
        result = ann.annotate_dataset([])
        assert result.rows == []
        assert result.quality_matrix == []
        assert all(v == 0.0 for v in result.overall_profile.values())

    def test_annotate_basic_dataset(self):
        texts = [
            "Machine learning models need quality training data to perform well. "
            "Good data leads to better model accuracy and generalization.",
            "The weather forecast predicts rain tomorrow. "
            "Bring an umbrella and wear waterproof shoes.",
            "Python is a popular programming language for data science. "
            "It has many libraries like NumPy, Pandas, and scikit-learn.",
        ]
        ann = Annotator()
        result = ann.annotate_dataset(texts)

        assert len(result.rows) == 3
        assert len(result.quality_matrix) == 3
        assert all(len(row) == 6 for row in result.quality_matrix)

        # All axes have summaries
        for ax in _AXES:
            assert ax in result.axis_summaries
            summary = result.axis_summaries[ax]
            assert 0.0 <= summary.mean <= 1.0
            assert summary.min <= summary.max

        # Overall profile has all axes
        assert set(result.overall_profile.keys()) == set(_AXES)

    def test_row_annotation_scores_in_range(self):
        texts = [
            "A detailed explanation of quantum computing and its implications for cryptography."
        ]
        ann = Annotator()
        result = ann.annotate_dataset(texts)
        row = result.rows[0]

        for ax in _AXES:
            score = getattr(row, ax)
            assert 0.0 <= score <= 1.0, f"{ax} = {score} out of range"

    def test_selective_axes(self):
        texts = ["Test text for selective annotation with sufficient length."]
        ann = Annotator(axes=["coherence", "safety"])
        result = ann.annotate_dataset(texts)

        row = result.rows[0]
        assert row.coherence > 0 or row.coherence == 1.0  # single sentence
        assert row.safety > 0
        # Non-selected axes should be 0
        assert row.complexity == 0.0
        assert row.informativeness == 0.0

    def test_invalid_axis_raises(self):
        with pytest.raises(ValueError, match="Unknown axis"):
            Annotator(axes=["nonexistent"])

    def test_to_dict(self):
        ann = Annotator()
        result = ann.annotate_dataset(["Test text with some content."])
        d = result.to_dict()
        assert "row_count" in d
        assert "axis_summaries" in d
        assert "overall_profile" in d
        assert d["row_count"] == 1

    def test_row_mean_score(self):
        row = RowAnnotation(
            coherence=0.8,
            informativeness=0.6,
            complexity=0.4,
            safety=1.0,
            formatting=0.9,
            uniqueness=0.7,
        )
        expected = (0.8 + 0.6 + 0.4 + 1.0 + 0.9 + 0.7) / 6
        assert abs(row.mean_score() - expected) < 0.001
