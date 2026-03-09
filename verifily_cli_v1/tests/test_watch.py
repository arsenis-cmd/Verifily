"""Tests for the watch command."""

from __future__ import annotations

from pathlib import Path

import pytest

from verifily_cli_v1.commands.watch import _compute_diff, _get_file_mtime


_BASE = {
    "row_count": 100,
    "pii_total_hits": 0,
    "pii_clean": True,
    "quality": {
        "quality_score": 80,
        "issues": [
            {"category": "length_outlier", "severity": "warning"},
        ],
    },
}


class TestComputeDiff:
    def test_quality_increase(self):
        curr = {**_BASE, "quality": {**_BASE["quality"], "quality_score": 90}}
        diffs = _compute_diff(_BASE, curr)
        assert any("90" in d for d in diffs)
        assert any("green" in d for d in diffs)

    def test_quality_decrease(self):
        curr = {**_BASE, "quality": {**_BASE["quality"], "quality_score": 60}}
        diffs = _compute_diff(_BASE, curr)
        assert any("60" in d for d in diffs)
        assert any("red" in d for d in diffs)

    def test_row_count_change(self):
        curr = {**_BASE, "row_count": 150}
        diffs = _compute_diff(_BASE, curr)
        assert any("150" in d for d in diffs)

    def test_pii_change(self):
        curr = {**_BASE, "pii_total_hits": 5}
        diffs = _compute_diff(_BASE, curr)
        assert any("PII" in d for d in diffs)

    def test_new_issue(self):
        curr = {
            **_BASE,
            "quality": {
                **_BASE["quality"],
                "issues": [
                    {"category": "length_outlier", "severity": "warning"},
                    {"category": "encoding", "severity": "error"},
                ],
            },
        }
        diffs = _compute_diff(_BASE, curr)
        assert any("encoding" in d for d in diffs)

    def test_fixed_issue(self):
        curr = {
            **_BASE,
            "quality": {**_BASE["quality"], "issues": []},
        }
        diffs = _compute_diff(_BASE, curr)
        assert any("FIXED" in d for d in diffs)

    def test_no_changes(self):
        diffs = _compute_diff(_BASE, _BASE)
        assert diffs == []


class TestGetFileMtime:
    def test_existing_file(self, tmp_path):
        f = tmp_path / "test.txt"
        f.write_text("hello")
        assert _get_file_mtime(f) > 0

    def test_missing_file(self):
        assert _get_file_mtime(Path("/nonexistent/file.txt")) == 0.0


class TestWatchCli:
    def test_watch_nonexistent_file(self):
        from typer.testing import CliRunner
        from verifily_cli_v1.cli import app
        result = CliRunner().invoke(app, ["watch", "--dataset", "/tmp/nonexistent_verifily.jsonl"])
        assert result.exit_code != 0
