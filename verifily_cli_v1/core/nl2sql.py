"""NL2SQL utilities — SQL canonicalization, template fingerprinting, validation.

Pure-Python, no external SQL parser required. All functions are deterministic.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional, Tuple

from verifily_cli_v1.core.hashing import sha256_string


# ── Regex patterns for SQL normalization ──────────────────────────

_RE_BLOCK_COMMENT = re.compile(r"/\*.*?\*/", re.DOTALL)
_RE_LINE_COMMENT = re.compile(r"--[^\n]*")
_RE_SINGLE_QUOTED = re.compile(r"'(?:''|[^'])*'")  # handles SQL '' escaping
_RE_NUMERIC = re.compile(r"\b\d+(?:\.\d+)?\b")
_RE_IN_LIST = re.compile(
    r"\bIN\s*\(\s*\?(?:\s*,\s*\?)*\s*\)", re.IGNORECASE
)
_RE_WHITESPACE = re.compile(r"\s+")


# ── SQL normalization ────────────────────────────────────────────


def normalize_sql(sql: str) -> str:
    """Canonicalize SQL for deterministic comparison.

    Steps:
    1. Strip block comments (/* ... */)
    2. Strip line comments (--)
    3. Collapse whitespace
    4. Lowercase
    5. Trim and strip trailing semicolons
    """
    s = sql
    s = _RE_BLOCK_COMMENT.sub(" ", s)
    s = _RE_LINE_COMMENT.sub(" ", s)
    s = _RE_WHITESPACE.sub(" ", s)
    s = s.lower()
    s = s.strip()
    s = s.rstrip(";").strip()
    return s


def sql_to_template(sql: str) -> str:
    """Convert SQL to a structural template by replacing literals with '?'.

    Applied after normalize_sql:
    1. Replace single-quoted string literals with ?
    2. Replace numeric literals with ?
    3. Collapse IN (?, ?, ...) to IN (?)
    """
    s = normalize_sql(sql)
    s = _RE_SINGLE_QUOTED.sub("?", s)
    s = _RE_NUMERIC.sub("?", s)
    s = _RE_IN_LIST.sub("in (?)", s)
    s = _RE_WHITESPACE.sub(" ", s).strip()
    return s


# ── Fingerprints ─────────────────────────────────────────────────


def sql_fingerprint(sql: str) -> str:
    """SHA-256 of normalized SQL."""
    return sha256_string(normalize_sql(sql))


def template_fingerprint(sql: str) -> str:
    """SHA-256 of the SQL template (literals stripped)."""
    return sha256_string(sql_to_template(sql))


# ── Row validation ───────────────────────────────────────────────


def validate_nl2sql_row(
    row: Dict[str, Any], row_index: int
) -> Tuple[bool, str]:
    """Validate a single NL2SQL row.

    Required: question (non-empty str), sql (non-empty str)
    Required: schema (dict with 'tables' key) OR schema_ref (non-empty str)
    Optional: db_id (str), metadata (dict)

    Returns (ok, reason). reason is empty string when ok=True.
    """
    question = row.get("question", "")
    if not isinstance(question, str) or not question.strip():
        return False, f"row {row_index}: missing or empty 'question'"

    sql = row.get("sql", "")
    if not isinstance(sql, str) or not sql.strip():
        return False, f"row {row_index}: missing or empty 'sql'"

    has_schema = (
        "schema" in row
        and isinstance(row["schema"], dict)
        and "tables" in row["schema"]
    )
    has_schema_ref = (
        "schema_ref" in row
        and isinstance(row["schema_ref"], str)
        and row["schema_ref"].strip() != ""
    )

    if not has_schema and not has_schema_ref:
        return (
            False,
            f"row {row_index}: must have 'schema' (dict with 'tables') or 'schema_ref' (str)",
        )

    return True, ""


# ── Row enrichment ───────────────────────────────────────────────


def enrich_nl2sql_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """Add fingerprint fields to an NL2SQL row.

    Adds: sql_normalized, sql_template, sql_fingerprint, template_fingerprint.
    Returns new dict (does not mutate input).
    """
    sql = row.get("sql", "")
    enriched = dict(row)
    enriched["sql_normalized"] = normalize_sql(sql)
    enriched["sql_template"] = sql_to_template(sql)
    enriched["sql_fingerprint"] = sql_fingerprint(sql)
    enriched["template_fingerprint"] = template_fingerprint(sql)
    return enriched


# ── Grouping ─────────────────────────────────────────────────────


def group_by_template(
    rows: List[Dict[str, Any]],
) -> Dict[str, List[int]]:
    """Group row indices by template_fingerprint."""
    groups: Dict[str, List[int]] = {}
    for i, row in enumerate(rows):
        tf = row.get(
            "template_fingerprint", template_fingerprint(row.get("sql", ""))
        )
        groups.setdefault(tf, []).append(i)
    return groups


def group_by_field(
    rows: List[Dict[str, Any]], field: str
) -> Dict[str, List[int]]:
    """Group row indices by an arbitrary string field (db_id, schema_ref, etc.)."""
    groups: Dict[str, List[int]] = {}
    for i, row in enumerate(rows):
        key = str(row.get(field, "__none__")).strip() or "__none__"
        groups.setdefault(key, []).append(i)
    return groups
