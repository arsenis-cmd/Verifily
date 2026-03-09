"""Tests for NL2SQL features — SQL normalization, fingerprints, split, gate."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from verifily_cli_v1.core.nl2sql import (
    enrich_nl2sql_row,
    group_by_template,
    normalize_sql,
    sql_fingerprint,
    sql_to_template,
    template_fingerprint,
    validate_nl2sql_row,
)


# ── Helpers ──────────────────────────────────────────────────────


def _write_jsonl(path: Path, rows: list):
    with open(path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def _make_row(
    question: str = "How many users?",
    sql: str = "SELECT COUNT(*) FROM users",
    db_id: str = "test_db",
    use_schema_ref: bool = False,
) -> dict:
    row = {"question": question, "sql": sql, "db_id": db_id}
    if use_schema_ref:
        row["schema_ref"] = "company_schema_v1"
    else:
        row["schema"] = {
            "tables": [{"name": "users", "columns": ["id", "name", "age"]}]
        }
    return row


# ── TestNormalizeSql ─────────────────────────────────────────────


class TestNormalizeSql:
    def test_lowercase_keywords(self):
        assert normalize_sql("SELECT * FROM users") == "select * from users"

    def test_strip_line_comment(self):
        result = normalize_sql("SELECT * -- get all\nFROM t")
        assert result == "select * from t"

    def test_strip_block_comment(self):
        result = normalize_sql("SELECT /* cols */ * FROM t")
        assert result == "select * from t"

    def test_collapse_whitespace(self):
        result = normalize_sql("SELECT  *\n  FROM   t")
        assert result == "select * from t"

    def test_strip_semicolons(self):
        assert normalize_sql("SELECT * FROM t;") == "select * from t"
        assert normalize_sql("SELECT * FROM t;;") == "select * from t"

    def test_idempotent(self):
        sql = "SELECT e.name FROM employees e WHERE e.id = 42;"
        once = normalize_sql(sql)
        twice = normalize_sql(once)
        assert once == twice


# ── TestSqlTemplate ──────────────────────────────────────────────


class TestSqlTemplate:
    def test_replace_string_literal(self):
        result = sql_to_template("SELECT * FROM t WHERE name = 'Alice'")
        assert "alice" not in result
        assert "?" in result
        assert "where name = ?" in result

    def test_replace_numeric_literal(self):
        result = sql_to_template("SELECT * FROM t WHERE id = 42")
        assert "42" not in result
        assert "where id = ?" in result

    def test_replace_float(self):
        result = sql_to_template("SELECT * FROM t WHERE score > 3.14")
        assert "3.14" not in result
        assert "where score > ?" in result

    def test_collapse_in_list(self):
        result = sql_to_template("SELECT * FROM t WHERE id IN (1, 2, 3)")
        assert result.endswith("in (?)")

    def test_mixed_literals(self):
        sql = "SELECT * FROM t WHERE name = 'Bob' AND age > 30 AND id IN (1, 2, 3)"
        result = sql_to_template(sql)
        assert "'bob'" not in result
        assert "30" not in result
        assert result.count("?") >= 3

    def test_escaped_quotes(self):
        result = sql_to_template("SELECT * FROM t WHERE name = 'O''Brien'")
        assert "o''brien" not in result
        assert "?" in result


# ── TestFingerprints ─────────────────────────────────────────────


class TestFingerprints:
    def test_same_sql_same_fingerprint(self):
        sql = "SELECT * FROM users WHERE id = 1"
        assert sql_fingerprint(sql) == sql_fingerprint(sql)

    def test_different_sql_different_fp(self):
        assert sql_fingerprint("SELECT * FROM a") != sql_fingerprint(
            "SELECT * FROM b"
        )

    def test_template_groups_variants(self):
        """Same template structure with different literals should share template_fingerprint."""
        sql_a = "SELECT * FROM users WHERE id = 1"
        sql_b = "SELECT * FROM users WHERE id = 999"
        assert template_fingerprint(sql_a) == template_fingerprint(sql_b)
        # But their sql_fingerprints differ
        assert sql_fingerprint(sql_a) != sql_fingerprint(sql_b)

    def test_fingerprint_stability(self):
        """Regression test: fingerprint of known SQL should not change."""
        fp = sql_fingerprint("SELECT * FROM users")
        # Just ensure it's a hex string of expected length
        assert len(fp) == 64
        assert all(c in "0123456789abcdef" for c in fp)
        # Template fingerprint of same SQL should also be stable
        tfp = template_fingerprint("SELECT * FROM users")
        assert len(tfp) == 64


# ── TestValidation ───────────────────────────────────────────────


class TestValidation:
    def test_valid_row_with_schema(self):
        row = _make_row()
        ok, reason = validate_nl2sql_row(row, 0)
        assert ok is True
        assert reason == ""

    def test_valid_row_with_schema_ref(self):
        row = _make_row(use_schema_ref=True)
        ok, reason = validate_nl2sql_row(row, 0)
        assert ok is True

    def test_missing_question(self):
        row = _make_row()
        del row["question"]
        ok, reason = validate_nl2sql_row(row, 0)
        assert ok is False
        assert "question" in reason

    def test_missing_both_schema_fields(self):
        row = {"question": "Q", "sql": "SELECT 1"}
        ok, reason = validate_nl2sql_row(row, 0)
        assert ok is False
        assert "schema" in reason


# ── TestEnrichRow ────────────────────────────────────────────────


class TestEnrichRow:
    def test_adds_fingerprint_fields(self):
        row = _make_row()
        enriched = enrich_nl2sql_row(row)
        assert "sql_fingerprint" in enriched
        assert "template_fingerprint" in enriched
        assert "sql_template" in enriched
        assert "sql_normalized" in enriched

    def test_deterministic(self):
        row = _make_row()
        a = enrich_nl2sql_row(row)
        b = enrich_nl2sql_row(row)
        assert a["sql_fingerprint"] == b["sql_fingerprint"]
        assert a["template_fingerprint"] == b["template_fingerprint"]


# ── TestSplit ────────────────────────────────────────────────────


class TestSplit:
    def test_no_template_leakage(self, tmp_path):
        from verifily_cli_v1.commands.nl2sql import run_split

        # Create rows with distinct templates
        rows = []
        for i in range(30):
            rows.append(
                _make_row(
                    question=f"Q{i}",
                    sql=f"SELECT * FROM t{i % 10} WHERE id = {i}",
                )
            )
        _write_jsonl(tmp_path / "data.jsonl", rows)

        result = run_split(
            input_path=str(tmp_path / "data.jsonl"),
            out_dir=str(tmp_path / "splits"),
            eval_ratio=0.2,
            seed=42,
        )

        assert result["leakage_free"] is True
        assert result["group_overlap"] == 0

    def test_deterministic(self, tmp_path):
        from verifily_cli_v1.commands.nl2sql import run_split

        rows = [_make_row(question=f"Q{i}", sql=f"SELECT {i} FROM t") for i in range(20)]
        _write_jsonl(tmp_path / "data.jsonl", rows)

        r1 = run_split(
            input_path=str(tmp_path / "data.jsonl"),
            out_dir=str(tmp_path / "s1"),
            eval_ratio=0.2,
            seed=42,
        )
        r2 = run_split(
            input_path=str(tmp_path / "data.jsonl"),
            out_dir=str(tmp_path / "s2"),
            eval_ratio=0.2,
            seed=42,
        )
        assert r1["train_rows"] == r2["train_rows"]
        assert r1["eval_rows"] == r2["eval_rows"]

    def test_all_rows_accounted(self, tmp_path):
        from verifily_cli_v1.commands.nl2sql import run_split

        rows = [_make_row(question=f"Q{i}", sql=f"SELECT {i} FROM t") for i in range(25)]
        _write_jsonl(tmp_path / "data.jsonl", rows)

        result = run_split(
            input_path=str(tmp_path / "data.jsonl"),
            out_dir=str(tmp_path / "splits"),
            eval_ratio=0.3,
            seed=42,
        )
        assert result["train_rows"] + result["eval_rows"] == 25


# ── TestGate ─────────────────────────────────────────────────────


class TestGate:
    def test_exact_overlap_fails(self, tmp_path):
        from verifily_cli_v1.commands.nl2sql import run_gate

        shared_sql = "SELECT * FROM users WHERE id = 1"
        train = [_make_row(question="Q1", sql=shared_sql)]
        eval_rows = [_make_row(question="Q2", sql=shared_sql)]  # same SQL
        _write_jsonl(tmp_path / "train.jsonl", train)
        _write_jsonl(tmp_path / "eval.jsonl", eval_rows)

        result = run_gate(
            train=str(tmp_path / "train.jsonl"),
            eval_set=str(tmp_path / "eval.jsonl"),
        )
        assert result["status"] == "FAIL"
        assert result["exit_code"] == 1
        assert result["exact_sql_overlaps"] > 0

    def test_template_overlap_warns(self, tmp_path):
        from verifily_cli_v1.commands.nl2sql import run_gate

        # Same template, different literal → template overlap
        train = [
            _make_row(question=f"Find user {i}", sql=f"SELECT * FROM users WHERE id = {i}")
            for i in range(10)
        ]
        # Eval uses same template but different numbers
        eval_rows = [
            _make_row(question=f"Get user {i}", sql=f"SELECT * FROM users WHERE id = {i + 100}")
            for i in range(10)
        ]
        _write_jsonl(tmp_path / "train.jsonl", train)
        _write_jsonl(tmp_path / "eval.jsonl", eval_rows)

        result = run_gate(
            train=str(tmp_path / "train.jsonl"),
            eval_set=str(tmp_path / "eval.jsonl"),
        )
        # All eval rows have template overlap (100%)
        assert result["template_overlaps"] == 10
        assert result["status"] == "WARN"
        assert result["exit_code"] == 2

    def test_clean_passes(self, tmp_path):
        from verifily_cli_v1.commands.nl2sql import run_gate

        train = [
            _make_row(question="How many users?", sql="SELECT COUNT(*) FROM users"),
            _make_row(question="List departments", sql="SELECT * FROM departments"),
        ]
        eval_rows = [
            _make_row(question="Total revenue?", sql="SELECT SUM(revenue) FROM orders"),
            _make_row(question="Active projects?", sql="SELECT * FROM projects WHERE active = 1"),
        ]
        _write_jsonl(tmp_path / "train.jsonl", train)
        _write_jsonl(tmp_path / "eval.jsonl", eval_rows)

        result = run_gate(
            train=str(tmp_path / "train.jsonl"),
            eval_set=str(tmp_path / "eval.jsonl"),
        )
        assert result["status"] == "PASS"
        assert result["exit_code"] == 0


# ── TestValidateCommand ──────────────────────────────────────────


class TestValidateCommand:
    def test_valid_dataset(self, tmp_path):
        from verifily_cli_v1.commands.nl2sql import run_validate

        rows = [_make_row(question=f"Q{i}", sql=f"SELECT {i}") for i in range(5)]
        _write_jsonl(tmp_path / "data.jsonl", rows)

        result = run_validate(input_path=str(tmp_path / "data.jsonl"))
        assert result["status"] == "PASS"
        assert result["valid"] == 5
        assert result["invalid"] == 0

    def test_invalid_rows_detected(self, tmp_path):
        from verifily_cli_v1.commands.nl2sql import run_validate

        rows = [
            _make_row(),
            {"sql": "SELECT 1"},  # missing question
            {"question": "Q", "sql": ""},  # empty sql
        ]
        _write_jsonl(tmp_path / "data.jsonl", rows)

        result = run_validate(input_path=str(tmp_path / "data.jsonl"))
        assert result["status"] == "FAIL"
        assert result["invalid"] == 2
