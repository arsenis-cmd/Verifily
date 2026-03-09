"""Tests for interactive HTML report features."""

from __future__ import annotations

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
                {"category": "encoding", "severity": "error",
                 "count": 2, "fraction": 0.02,
                 "description": "2 rows have encoding issues"},
                {"category": "near_duplicate", "severity": "info",
                 "count": 1, "fraction": 0.01,
                 "description": "1 near duplicate detected"},
            ],
            "stats": {
                "type_token_ratio": 0.65,
                "unique_tokens": 500,
                "total_tokens": 770,
                "hapax_ratio": 0.4,
                "near_duplicate_count": 2,
            },
        },
        "sample_rows": [
            {"input": f"Question {i}", "output": f"Answer {i}"}
            for i in range(15)
        ],
    }
}


class TestCollapsibleSections:
    def test_sections_have_section_body(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "section-body" in html

    def test_h2_has_cursor_pointer_css(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "cursor: pointer" in html

    def test_collapsed_css_exists(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert ".collapsed" in html

    def test_js_has_collapse_handler(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "toggle('collapsed')" in html


class TestSortableTables:
    def test_field_stats_table_is_sortable(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert 'class="sortable"' in html

    def test_sortable_css_exists(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert ".sortable th" in html

    def test_js_has_sort_handler(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "sortDir" in html


class TestIssueFilters:
    def test_filter_bar_exists(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "issue-filters" in html

    def test_filter_buttons_have_severity(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert 'data-severity="error"' in html
        assert 'data-severity="warning"' in html
        assert 'data-severity="info"' in html

    def test_filter_buttons_show_counts(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "Error (1)" in html
        assert "Warning (1)" in html
        assert "Info (1)" in html

    def test_no_filters_when_no_issues(self):
        report = {
            "report": {
                "path": "test.jsonl", "row_count": 10, "schema": "sft",
                "field_stats": {}, "pii_scan": {}, "pii_total_hits": 0, "pii_clean": True,
                "quality": {"quality_score": 90, "issues": [], "stats": {}},
            }
        }
        html = generate_html_report(report)
        assert 'id="issue-filters"' not in html


class TestSearchBox:
    def test_search_box_exists(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "verifily-search" in html

    def test_search_placeholder(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "Search issues, fields, tags" in html

    def test_js_has_search_handler(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "verifily-search" in html
        assert "input" in html  # event listener


class TestSampleRows:
    def test_sample_rows_rendered(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "Sample Rows" in html

    def test_first_10_visible(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "Question 0" in html
        assert "Question 9" in html

    def test_extra_rows_hidden(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "sample-row-hidden" in html

    def test_expand_button_exists(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert "expand-rows-btn" in html
        assert "Show all 15 rows" in html

    def test_no_sample_rows_section_when_empty(self):
        report = {
            "report": {
                "path": "test.jsonl", "row_count": 10, "schema": "sft",
                "field_stats": {}, "pii_scan": {}, "pii_total_hits": 0, "pii_clean": True,
                "quality": {"quality_score": 90, "issues": [], "stats": {}},
            }
        }
        html = generate_html_report(report)
        assert "Sample Rows" not in html


class TestLiveReload:
    def test_no_refresh_by_default(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert 'http-equiv="refresh"' not in html

    def test_refresh_tag_when_enabled(self):
        html = generate_html_report(_SAMPLE_REPORT, live_reload=3)
        assert 'http-equiv="refresh" content="3"' in html

    def test_write_html_threads_live_reload(self, tmp_path):
        out = tmp_path / "report.html"
        write_html_report(_SAMPLE_REPORT, out, open_browser=False, live_reload=5)
        content = out.read_text()
        assert 'http-equiv="refresh" content="5"' in content

    def test_live_reload_zero_no_tag(self):
        html = generate_html_report(_SAMPLE_REPORT, live_reload=0)
        assert 'http-equiv="refresh"' not in html


class TestJsIncluded:
    def test_script_tag_present(self):
        html = generate_html_report(_SAMPLE_REPORT)
        # Should have both the JSON data script and the interactive JS script
        assert 'id="verifily-data"' in html
        assert "DOMContentLoaded" in html

    def test_no_external_scripts(self):
        html = generate_html_report(_SAMPLE_REPORT)
        assert '<script src=' not in html
