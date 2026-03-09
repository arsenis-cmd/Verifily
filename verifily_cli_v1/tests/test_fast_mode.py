"""Tests for fast/deep mode in quality analysis."""

from __future__ import annotations

import time

import pytest

from verifily_cli_v1.core.quality import analyze_quality


_ROWS = [
    {"input": f"Question {i}: What is the capital of France?", "output": f"The capital of France is Paris. Answer {i}."}
    for i in range(50)
]


class TestFastMode:
    def test_fast_mode_returns_quality_report(self):
        result = analyze_quality(_ROWS, fast=True)
        assert result.total_rows == 50
        assert 0 <= result.quality_score <= 100

    def test_fast_mode_completes_quickly(self):
        t0 = time.monotonic()
        analyze_quality(_ROWS, fast=True)
        elapsed = time.monotonic() - t0
        assert elapsed < 15.0, f"Fast mode took {elapsed:.1f}s, expected <15s"

    def test_fast_mode_has_vocab_stats(self):
        result = analyze_quality(_ROWS, fast=True)
        assert "type_token_ratio" in result.stats
        assert "unique_tokens" in result.stats
        assert "total_tokens" in result.stats

    def test_fast_mode_has_near_dup_count(self):
        result = analyze_quality(_ROWS, fast=True)
        assert "near_duplicate_count" in result.stats

    def test_fast_mode_has_semantic_dup_stats(self):
        result = analyze_quality(_ROWS, fast=True)
        assert "semantic_dup_count" in result.stats
        assert "semantic_dup_fraction" in result.stats

    def test_fast_mode_has_topic_stats(self):
        result = analyze_quality(_ROWS, fast=True)
        assert "topic_count" in result.stats
        assert "topic_diversity" in result.stats

    def test_fast_mode_skips_annotator(self):
        result = analyze_quality(_ROWS, fast=True)
        assert "axis_profile" not in result.stats

    def test_fast_mode_skips_domain_detection(self):
        result = analyze_quality(_ROWS, fast=True)
        assert "detected_domain" not in result.stats

    def test_fast_mode_skips_model_judge(self):
        result = analyze_quality(_ROWS, fast=True)
        assert "model_quality" not in result.stats

    def test_fast_mode_has_heuristic_issues(self):
        # 50 identical-structure rows should trigger near-dup or repetition
        result = analyze_quality(_ROWS, fast=True)
        assert isinstance(result.issues, list)

    def test_fast_is_default(self):
        """Fast mode should be the default."""
        import inspect
        sig = inspect.signature(analyze_quality)
        assert sig.parameters["fast"].default is True

    def test_deep_mode_flag(self):
        """Deep mode (fast=False) should accept the flag without error."""
        # Just verify it doesn't crash on small data — don't wait for ML models
        # if they're not installed
        result = analyze_quality(_ROWS[:5], fast=False)
        assert result.total_rows == 5

    def test_empty_rows_fast(self):
        result = analyze_quality([], fast=True)
        assert result.total_rows == 0
        assert result.quality_score == 0

    def test_score_is_reasonable(self):
        result = analyze_quality(_ROWS, fast=True)
        # Score should be reasonable even in fast mode
        assert 30 <= result.quality_score <= 100


class TestReportFastMode:
    def test_dataset_report_accepts_fast(self):
        from verifily_cli_v1.commands.report import dataset_report
        report = dataset_report("examples/ingest_demo/data_sft.jsonl", fast=True)
        assert report["row_count"] == 8
        assert "quality" in report

    def test_dataset_report_fast_timing(self):
        from verifily_cli_v1.commands.report import dataset_report
        t0 = time.monotonic()
        dataset_report("examples/ingest_demo/data_sft.jsonl", fast=True)
        elapsed = time.monotonic() - t0
        assert elapsed < 15.0, f"Fast report took {elapsed:.1f}s"


class TestCliFlags:
    def test_report_has_deep_flag(self):
        from typer.testing import CliRunner
        from verifily_cli_v1.cli import app
        result = CliRunner().invoke(app, ["report", "--help"])
        assert "--deep" in result.output

    def test_report_has_html_flag(self):
        from typer.testing import CliRunner
        from verifily_cli_v1.cli import app
        result = CliRunner().invoke(app, ["report", "--help"])
        assert "--html" in result.output

    def test_check_has_deep_flag(self):
        from typer.testing import CliRunner
        from verifily_cli_v1.cli import app
        result = CliRunner().invoke(app, ["check", "--help"])
        assert "--deep" in result.output

    def test_watch_command_exists(self):
        from typer.testing import CliRunner
        from verifily_cli_v1.cli import app
        result = CliRunner().invoke(app, ["watch", "--help"])
        assert result.exit_code == 0
        assert "--dataset" in result.output
