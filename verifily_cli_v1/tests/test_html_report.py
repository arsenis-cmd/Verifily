"""Tests for HTML report generation."""

from __future__ import annotations

from pathlib import Path

import pytest

from verifily_cli_v1.core.html_report import generate_html_report, write_html_report


_SAMPLE_REPORT = {
    "report": {
        "path": "test.jsonl",
        "row_count": 100,
        "schema": "sft",
        "field_stats": {
            "input": {"present": 100, "empty": 0, "avg_len": 50.0},
            "output": {"present": 100, "empty": 2, "avg_len": 150.0},
        },
        "tag_distribution": {"source": {"human": 80, "synthetic": 20}},
        "pii_scan": {"phone": {"count": 3, "rows": [1, 5, 12]}},
        "pii_total_hits": 3,
        "pii_clean": False,
        "quality": {
            "total_rows": 100,
            "quality_score": 78,
            "issues": [
                {"category": "length_outlier", "severity": "warning",
                 "count": 5, "fraction": 0.05,
                 "description": "5 rows have abnormal length"},
            ],
            "stats": {
                "type_token_ratio": 0.65,
                "unique_tokens": 500,
                "total_tokens": 770,
                "hapax_ratio": 0.4,
                "near_duplicate_count": 2,
            },
        },
    }
}

_PIPELINE_RESULT = {
    **_SAMPLE_REPORT,
    "decision": {
        "recommendation": "SHIP",
        "confidence": 0.95,
        "exit_code": 0,
    },
    "contamination": {
        "status": "PASS",
        "exact_overlaps": 0,
        "near_duplicates": 0,
        "exact_overlap_fraction": 0.0,
        "near_duplicate_fraction": 0.0,
    },
    "risk_score": {"total": 15, "level": "LOW"},
    "health_index": {"total": 88, "level": "EXCELLENT"},
}


class TestGenerateHtml:
    def test_returns_string(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert isinstance(html, str)
        assert len(html) > 100

    def test_valid_html5(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "<!DOCTYPE html>" in html
        assert "<html" in html
        assert "</html>" in html

    def test_self_contained(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert '<link rel="stylesheet"' not in html
        assert '<script src=' not in html

    def test_has_quality_gauge(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "gauge" in html
        assert "78" in html  # quality score

    def test_has_pii_section(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "phone" in html
        assert "3" in html  # PII count

    def test_has_field_stats(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "input" in html
        assert "output" in html

    def test_has_issues(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "abnormal length" in html

    def test_has_tag_distribution(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "human" in html
        assert "synthetic" in html

    def test_has_vocab_stats(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "0.650" in html  # TTR

    def test_has_json_data_embed(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert 'id="verifily-data"' in html

    def test_responsive_meta(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "viewport" in html

    def test_escapes_html(self):
        evil = {
            "report": {
                "path": "<script>alert('xss')</script>",
                "row_count": 1,
                "schema": "sft",
                "field_stats": {},
                "pii_scan": {},
                "pii_total_hits": 0,
                "pii_clean": True,
                "quality": {"quality_score": 50, "issues": [], "stats": {}},
            }
        }
        html = generate_html_report(evil)
        assert "<script>alert" not in html
        assert "&lt;script&gt;" in html or "verifily-data" in html

    def test_empty_report(self):
        html = generate_html_report({"report": {}})
        assert "<!DOCTYPE html>" in html

    def test_decision_banner_ship(self):
        html = generate_html_report(_PIPELINE_RESULT)
        assert "SHIP" in html
        assert "decision-ship" in html

    def test_decision_banner_dont_ship(self):
        result = {**_PIPELINE_RESULT, "decision": {"recommendation": "DONT_SHIP", "confidence": 0.2, "exit_code": 1}}
        html = generate_html_report(result)
        assert "DONT_SHIP" in html

    def test_contamination_section(self):
        html = generate_html_report(_PIPELINE_RESULT)
        assert "Contamination" in html
        assert "PASS" in html

    def test_risk_health_gauges(self):
        html = generate_html_report(_PIPELINE_RESULT)
        assert "Risk" in html
        assert "Health" in html


class TestWriteHtml:
    def test_creates_file(self, tmp_path):
        out = tmp_path / "report.html"
        result = write_html_report(_SAMPLE_REPORT, out, open_browser=False)
        assert result == out
        assert out.exists()
        content = out.read_text()
        assert "<!DOCTYPE html>" in content

    def test_creates_parent_dirs(self, tmp_path):
        out = tmp_path / "sub" / "dir" / "report.html"
        write_html_report(_SAMPLE_REPORT, out, open_browser=False)
        assert out.exists()
