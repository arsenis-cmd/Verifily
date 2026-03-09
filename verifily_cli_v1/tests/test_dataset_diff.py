"""Tests for verifily_cli_v1.core.dataset_diff — dataset comparison."""

import pytest

from verifily_cli_v1.core.dataset_diff import (
    DatasetDiff,
    diff_datasets,
    format_diff_report,
    _extract_text,
    _row_fingerprint,
)


def _make_rows(texts, category=None):
    rows = []
    for t in texts:
        row = {"text": t}
        if category:
            row["category"] = category
        rows.append(row)
    return rows


class TestRowFingerprint:
    def test_identical_rows_same_fingerprint(self):
        row = {"text": "Hello world"}
        assert _row_fingerprint(row) == _row_fingerprint(row)

    def test_different_rows_different_fingerprint(self):
        row_a = {"text": "Hello world"}
        row_b = {"text": "Goodbye world"}
        assert _row_fingerprint(row_a) != _row_fingerprint(row_b)

    def test_case_insensitive(self):
        row_a = {"text": "Hello World"}
        row_b = {"text": "hello world"}
        assert _row_fingerprint(row_a) == _row_fingerprint(row_b)


class TestExtractText:
    def test_extracts_text_field(self):
        assert _extract_text({"text": "hello"}) == "hello"

    def test_extracts_multiple_fields(self):
        row = {"instruction": "do this", "response": "done"}
        text = _extract_text(row)
        assert "do this" in text
        assert "done" in text

    def test_fallback_to_all_strings(self):
        row = {"custom_field": "value", "num": 42}
        text = _extract_text(row)
        assert "value" in text


class TestDiffIdentical:
    def test_identical_datasets(self):
        rows = _make_rows(["hello world", "foo bar"])
        diff = diff_datasets(rows, rows, deep_compare=False)
        assert diff.added_count == 0
        assert diff.removed_count == 0
        assert diff.unchanged_count == 2
        assert diff.overlap_ratio == 1.0

    def test_empty_datasets(self):
        diff = diff_datasets([], [])
        assert diff.overlap_ratio == 1.0
        assert diff.added_count == 0


class TestDiffDisjoint:
    def test_completely_different(self):
        a = _make_rows(["hello world", "foo bar"])
        b = _make_rows(["quantum physics", "neural networks"])
        diff = diff_datasets(a, b, deep_compare=False)
        assert diff.added_count == 2
        assert diff.removed_count == 2
        assert diff.unchanged_count == 0
        assert diff.overlap_ratio == 0.0


class TestDiffPartialOverlap:
    def test_some_shared_rows(self):
        a = _make_rows(["shared row", "only in a"])
        b = _make_rows(["shared row", "only in b"])
        diff = diff_datasets(a, b, deep_compare=False)
        assert diff.unchanged_count == 1
        assert diff.added_count == 1
        assert diff.removed_count == 1

    def test_added_rows(self):
        a = _make_rows(["row one"])
        b = _make_rows(["row one", "row two", "row three"])
        diff = diff_datasets(a, b, deep_compare=False)
        assert diff.added_count == 2
        assert diff.removed_count == 0
        assert diff.unchanged_count == 1

    def test_removed_rows(self):
        a = _make_rows(["row one", "row two", "row three"])
        b = _make_rows(["row one"])
        diff = diff_datasets(a, b, deep_compare=False)
        assert diff.removed_count == 2
        assert diff.added_count == 0


class TestDiffDeep:
    def test_quality_delta_computed(self):
        a = _make_rows([
            "Machine learning requires quality data for training models effectively.",
            "Deep neural networks process information through multiple layers.",
            "Natural language processing enables computers to understand text.",
        ])
        b = _make_rows([
            "Quality data is essential for machine learning model training.",
            "Multiple processing layers help deep neural networks learn patterns.",
            "Text understanding by computers is enabled through NLP techniques.",
            "Reinforcement learning uses reward signals to train agents.",
        ])
        diff = diff_datasets(a, b, deep_compare=True)
        assert "quality_score" in diff.quality_delta

    def test_distribution_changes_detected(self):
        a = _make_rows(["short"] * 20 + ["this is a longer sentence with more words"] * 5)
        b = _make_rows(["this is a much longer sentence with many more words in it"] * 20 + ["tiny"] * 5)
        diff = diff_datasets(a, b, deep_compare=True)
        # Should have at least length distribution and vocabulary tests
        assert len(diff.distribution_changes) > 0

    def test_category_drift_detected(self):
        a = _make_rows(["text a"] * 10, category="science") + _make_rows(["text b"] * 10, category="art")
        b = _make_rows(["text c"] * 18, category="science") + _make_rows(["text d"] * 2, category="art")
        diff = diff_datasets(a, b, deep_compare=True)
        # Should detect category distribution shift
        cat_tests = [t for t in diff.distribution_changes if t.feature_name == "category_distribution"]
        assert len(cat_tests) > 0


class TestSamples:
    def test_sample_added_limited(self):
        a = _make_rows(["shared row"])
        b = _make_rows(["shared row"] + [f"new row {i}" for i in range(20)])
        diff = diff_datasets(a, b, deep_compare=False, max_samples=3)
        assert len(diff.sample_added) <= 3

    def test_sample_removed_limited(self):
        a = _make_rows([f"old row {i}" for i in range(20)] + ["shared"])
        b = _make_rows(["shared"])
        diff = diff_datasets(a, b, deep_compare=False, max_samples=3)
        assert len(diff.sample_removed) <= 3


class TestFormatDiffReport:
    def test_format_report(self):
        a = _make_rows(["hello", "world"])
        b = _make_rows(["hello", "universe"])
        diff = diff_datasets(a, b, deep_compare=False)
        report = format_diff_report(diff)
        assert "Dataset Diff Report" in report
        assert "Added" in report
        assert "Removed" in report


class TestToDict:
    def test_to_dict(self):
        diff = diff_datasets(
            _make_rows(["a"]),
            _make_rows(["b"]),
            deep_compare=False,
        )
        d = diff.to_dict()
        assert "added_count" in d
        assert "overlap_ratio" in d
        assert "quality_delta" in d
