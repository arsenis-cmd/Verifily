"""verifily nl2sql — validate, fingerprint, split, and gate NL2SQL datasets."""

from __future__ import annotations

import json
import random
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from rich.console import Console
from rich.table import Table

from verifily_cli_v1.core.hashing import sha256_string
from verifily_cli_v1.core.io import ensure_dir, read_jsonl, write_json, write_jsonl
from verifily_cli_v1.core.nl2sql import (
    enrich_nl2sql_row,
    group_by_field,
    group_by_template,
    normalize_sql,
    sql_fingerprint,
    sql_to_template,
    template_fingerprint,
    validate_nl2sql_row,
)

console = Console(stderr=True)


# ── Helpers ──────────────────────────────────────────────────────


def _ngrams(text: str, n: int = 3) -> Set[str]:
    """Character n-grams for Jaccard similarity."""
    text = text.lower().strip()
    if len(text) < n:
        return {text} if text else set()
    return {text[i : i + n] for i in range(len(text) - n + 1)}


def _jaccard(a: Set[str], b: Set[str]) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _row_id(row: Dict[str, Any], index: int) -> str:
    """Get a displayable row identifier."""
    return str(row.get("id", f"row_{index}"))


# ── Validate ─────────────────────────────────────────────────────


def run_validate(
    *,
    input_path: str,
    output: Optional[str] = None,
    strict: bool = False,
    verbose: bool = False,
) -> Dict[str, Any]:
    """Validate NL2SQL dataset rows for required fields.

    Returns:
        {status, total, valid, invalid, errors: [{row, reason}]}
    """
    rows = read_jsonl(input_path)
    errors: List[Dict[str, Any]] = []

    for i, row in enumerate(rows):
        ok, reason = validate_nl2sql_row(row, i)
        if not ok:
            errors.append({"row": i, "reason": reason})
            if strict:
                break

    total = len(rows)
    invalid = len(errors)
    valid = total - invalid
    status = "PASS" if invalid == 0 else "FAIL"

    result = {
        "status": status,
        "total": total,
        "valid": valid,
        "invalid": invalid,
        "errors": errors[:50],  # cap reported errors
    }

    # Rich output
    console.print(f"\n[bold]NL2SQL Validation:[/bold] {input_path}\n")
    if status == "PASS":
        console.print(
            f"[green bold]PASS[/green bold] — {total} rows, all valid\n"
        )
    else:
        console.print(
            f"[red bold]FAIL[/red bold] — {valid}/{total} valid, {invalid} invalid\n"
        )
        if verbose:
            for e in errors[:20]:
                console.print(f"  {e['reason']}")

    if output:
        write_json(output, result)

    return result


# ── Fingerprint ──────────────────────────────────────────────────


def run_fingerprint(
    *,
    input_path: str,
    out_dir: str,
    verbose: bool = False,
) -> Dict[str, Any]:
    """Enrich NL2SQL rows with SQL fingerprints and write artifacts.

    Writes:
        out_dir/dataset.jsonl — enriched rows
        out_dir/fingerprint_summary.json — statistics
    """
    rows = read_jsonl(input_path)
    enriched = [enrich_nl2sql_row(row) for row in rows]

    out = ensure_dir(out_dir)
    write_jsonl(out / "dataset.jsonl", enriched)

    # Compute summary
    sql_fps = Counter(r["sql_fingerprint"] for r in enriched)
    tmpl_fps = Counter(r["template_fingerprint"] for r in enriched)

    # Template distribution: show top templates
    top_templates: List[Dict[str, Any]] = []
    for fp, count in tmpl_fps.most_common(20):
        example_row = next(
            r for r in enriched if r["template_fingerprint"] == fp
        )
        top_templates.append(
            {
                "template_fingerprint": fp[:16],
                "count": count,
                "example_template": example_row["sql_template"][:100],
            }
        )

    summary = {
        "total_rows": len(enriched),
        "unique_sql_fingerprints": len(sql_fps),
        "unique_template_fingerprints": len(tmpl_fps),
        "sql_dedup_ratio": 1 - len(sql_fps) / max(len(enriched), 1),
        "template_dedup_ratio": 1 - len(tmpl_fps) / max(len(enriched), 1),
        "top_templates": top_templates,
    }
    write_json(out / "fingerprint_summary.json", summary)

    # Rich output
    console.print(f"\n[bold]NL2SQL Fingerprint:[/bold] {input_path}\n")
    console.print(f"  Rows: {summary['total_rows']}")
    console.print(f"  Unique SQL:      {summary['unique_sql_fingerprints']}")
    console.print(f"  Unique templates: {summary['unique_template_fingerprints']}")
    console.print(f"  Output: {out}\n")

    if verbose and top_templates:
        tbl = Table(title="Top Templates")
        tbl.add_column("Fingerprint", style="cyan")
        tbl.add_column("Count")
        tbl.add_column("Example", style="dim")
        for t in top_templates[:10]:
            tbl.add_row(
                t["template_fingerprint"], str(t["count"]), t["example_template"]
            )
        console.print(tbl)

    return summary


# ── Split ────────────────────────────────────────────────────────


def run_split(
    *,
    input_path: str,
    out_dir: str,
    eval_ratio: float = 0.1,
    group: str = "template",
    seed: int = 42,
    verbose: bool = False,
) -> Dict[str, Any]:
    """Leakage-resistant train/eval split of NL2SQL dataset.

    Groups rows by template_fingerprint (or db_id/schema_ref),
    then assigns whole groups to train or eval.
    """
    rows = read_jsonl(input_path)

    # Enrich if not already
    enriched = []
    for row in rows:
        if "template_fingerprint" not in row:
            enriched.append(enrich_nl2sql_row(row))
        else:
            enriched.append(row)

    # Group
    if group == "template":
        groups = group_by_template(enriched)
    elif group in ("db_id", "schema_ref"):
        groups = group_by_field(enriched, group)
    else:
        raise ValueError(
            f"Unknown group key: {group}. Use 'template', 'db_id', or 'schema_ref'."
        )

    # Deterministic shuffle of group keys
    group_keys = sorted(groups.keys())
    rng = random.Random(seed)
    rng.shuffle(group_keys)

    # Fill eval until target ratio met
    target_eval = int(len(enriched) * eval_ratio)
    eval_indices: Set[int] = set()
    eval_groups: List[str] = []
    train_groups: List[str] = []

    for key in group_keys:
        if len(eval_indices) < target_eval:
            eval_indices.update(groups[key])
            eval_groups.append(key)
        else:
            train_groups.append(key)

    train_rows = [enriched[i] for i in range(len(enriched)) if i not in eval_indices]
    eval_rows = [enriched[i] for i in range(len(enriched)) if i in eval_indices]

    # Write
    out = ensure_dir(out_dir)
    write_jsonl(out / "train.jsonl", train_rows)
    write_jsonl(out / "eval.jsonl", eval_rows)

    # Verify zero group overlap
    train_fps = set()
    eval_fps = set()
    for r in train_rows:
        if group == "template":
            train_fps.add(r.get("template_fingerprint", ""))
        else:
            train_fps.add(str(r.get(group, "")))
    for r in eval_rows:
        if group == "template":
            eval_fps.add(r.get("template_fingerprint", ""))
        else:
            eval_fps.add(str(r.get(group, "")))
    overlap = train_fps & eval_fps

    manifest = {
        "total_rows": len(enriched),
        "train_rows": len(train_rows),
        "eval_rows": len(eval_rows),
        "eval_ratio_actual": len(eval_rows) / max(len(enriched), 1),
        "group_key": group,
        "total_groups": len(group_keys),
        "train_groups": len(train_groups),
        "eval_groups": len(eval_groups),
        "group_overlap": len(overlap),
        "seed": seed,
        "leakage_free": len(overlap) == 0,
    }
    write_json(out / "split_manifest.json", manifest)

    # Rich output
    console.print(f"\n[bold]NL2SQL Split:[/bold] {input_path}\n")
    console.print(f"  Total: {manifest['total_rows']}  Train: {manifest['train_rows']}  Eval: {manifest['eval_rows']}")
    console.print(f"  Groups ({group}): {manifest['total_groups']}  Train: {manifest['train_groups']}  Eval: {manifest['eval_groups']}")
    if manifest["leakage_free"]:
        console.print(f"  [green bold]Leakage-free:[/green bold] zero {group} overlap\n")
    else:
        console.print(f"  [red bold]WARNING:[/red bold] {len(overlap)} {group} groups in both splits\n")
    console.print(f"  Output: {out}\n")

    return manifest


# ── Gate (contamination check) ───────────────────────────────────


def run_gate(
    *,
    train: str,
    eval_set: str,
    jaccard_cutoff: float = 0.70,
    num_perm: int = 128,
    use_lsh: bool = True,
    output: Optional[str] = None,
    verbose: bool = False,
) -> Dict[str, Any]:
    """NL2SQL-specific contamination gate.

    Three-tier check:
    1. Exact SQL overlap (by sql_fingerprint)
    2. Template overlap (by template_fingerprint)
    3. Near-duplicate question overlap (n-gram Jaccard)

    Exit codes: 0=PASS, 1=FAIL (exact leaks), 2=WARN (template/near-dup).
    """
    train_rows = read_jsonl(train)
    eval_rows = read_jsonl(eval_set)

    # Enrich if needed
    train_enriched = [
        enrich_nl2sql_row(r) if "sql_fingerprint" not in r else r
        for r in train_rows
    ]
    eval_enriched = [
        enrich_nl2sql_row(r) if "sql_fingerprint" not in r else r
        for r in eval_rows
    ]

    # ── Tier 1: Exact SQL overlap ────────────────────────────────
    train_sql_fps: Dict[str, List[int]] = {}
    for i, r in enumerate(train_enriched):
        fp = r["sql_fingerprint"]
        train_sql_fps.setdefault(fp, []).append(i)

    exact_overlaps: List[Dict[str, Any]] = []
    exact_eval_indices: Set[int] = set()
    for j, r in enumerate(eval_enriched):
        fp = r["sql_fingerprint"]
        if fp in train_sql_fps:
            exact_overlaps.append({
                "eval_row": _row_id(r, j),
                "eval_index": j,
                "train_indices": train_sql_fps[fp][:3],
                "sql_fingerprint": fp[:16],
            })
            exact_eval_indices.add(j)

    # ── Tier 2: Template overlap ─────────────────────────────────
    train_tmpl_fps: Dict[str, List[int]] = {}
    for i, r in enumerate(train_enriched):
        fp = r["template_fingerprint"]
        train_tmpl_fps.setdefault(fp, []).append(i)

    template_overlaps: List[Dict[str, Any]] = []
    template_eval_indices: Set[int] = set()
    for j, r in enumerate(eval_enriched):
        if j in exact_eval_indices:
            continue  # already caught by tier 1
        fp = r["template_fingerprint"]
        if fp in train_tmpl_fps:
            template_overlaps.append({
                "eval_row": _row_id(r, j),
                "eval_index": j,
                "train_indices": train_tmpl_fps[fp][:3],
                "template_fingerprint": fp[:16],
            })
            template_eval_indices.add(j)

    # ── Tier 3: Question near-dup ────────────────────────────────
    caught_indices = exact_eval_indices | template_eval_indices
    question_near_dups: List[Dict[str, Any]] = []

    if use_lsh:
        from verifily_cli_v1.core.minhash_lsh import MinHashLSH, minhash_jaccard

        lsh = MinHashLSH(num_perm=num_perm, threshold=jaccard_cutoff)
        train_ngrams_cache: Dict[int, Set[str]] = {}
        for i, r in enumerate(train_enriched):
            ng = _ngrams(r.get("question", ""), n=3)
            train_ngrams_cache[i] = ng
            lsh.insert(i, ng)

        for j, r in enumerate(eval_enriched):
            if j in caught_indices:
                continue
            q_ngrams = _ngrams(r.get("question", ""), n=3)
            candidates = lsh.query(q_ngrams)
            for c in candidates:
                sim = _jaccard(q_ngrams, train_ngrams_cache[c])
                if sim >= jaccard_cutoff:
                    question_near_dups.append({
                        "eval_row": _row_id(r, j),
                        "eval_index": j,
                        "train_index": c,
                        "similarity": round(sim, 3),
                    })
                    break  # one match is enough
    else:
        # Brute-force
        train_ngrams_list = [
            _ngrams(r.get("question", ""), n=3) for r in train_enriched
        ]
        for j, r in enumerate(eval_enriched):
            if j in caught_indices:
                continue
            q_ngrams = _ngrams(r.get("question", ""), n=3)
            for i, t_ng in enumerate(train_ngrams_list):
                sim = _jaccard(q_ngrams, t_ng)
                if sim >= jaccard_cutoff:
                    question_near_dups.append({
                        "eval_row": _row_id(r, j),
                        "eval_index": j,
                        "train_index": i,
                        "similarity": round(sim, 3),
                    })
                    break

    # ── Decision ─────────────────────────────────────────────────
    n_eval = len(eval_enriched)
    exact_frac = len(exact_overlaps) / max(n_eval, 1)
    template_frac = len(template_overlaps) / max(n_eval, 1)
    question_frac = len(question_near_dups) / max(n_eval, 1)

    recommendations: List[str] = []

    if exact_overlaps:
        status = "FAIL"
        exit_code = 1
        recommendations.append(
            f"Remove {len(exact_overlaps)} eval rows with exact SQL match in training set."
        )
    elif template_frac > 0.05 or question_frac > 0.15:
        status = "WARN"
        exit_code = 2
        if template_frac > 0.05:
            recommendations.append(
                f"Re-split with --group template to eliminate {len(template_overlaps)} template overlaps."
            )
        if question_frac > 0.15:
            recommendations.append(
                f"Deduplicate questions: {len(question_near_dups)} near-duplicate pairs found."
            )
    else:
        status = "PASS"
        exit_code = 0

    if template_overlaps and not exact_overlaps:
        recommendations.append(
            "Consider splitting by template_fingerprint to prevent structural leakage."
        )

    result = {
        "status": status,
        "exit_code": exit_code,
        "train_rows": len(train_enriched),
        "eval_rows": n_eval,
        "exact_sql_overlaps": len(exact_overlaps),
        "exact_sql_fraction": round(exact_frac, 4),
        "template_overlaps": len(template_overlaps),
        "template_fraction": round(template_frac, 4),
        "question_near_dups": len(question_near_dups),
        "question_near_dup_fraction": round(question_frac, 4),
        "exact_examples": exact_overlaps[:10],
        "template_examples": template_overlaps[:10],
        "question_examples": question_near_dups[:10],
        "recommendations": recommendations,
        "method": "lsh" if use_lsh else "brute_force",
        "jaccard_cutoff": jaccard_cutoff,
    }

    # Rich output
    console.print(f"\n[bold]NL2SQL Contamination Gate[/bold]\n")
    console.print(f"  Train: {result['train_rows']} rows  Eval: {result['eval_rows']} rows\n")

    tbl = Table(title="Leakage Check")
    tbl.add_column("Tier", style="cyan")
    tbl.add_column("Count")
    tbl.add_column("Fraction")
    tbl.add_column("Status")
    tbl.add_row(
        "1. Exact SQL",
        str(result["exact_sql_overlaps"]),
        f"{exact_frac:.1%}",
        "[red bold]LEAK[/red bold]" if exact_overlaps else "[green]clean[/green]",
    )
    tbl.add_row(
        "2. Template",
        str(result["template_overlaps"]),
        f"{template_frac:.1%}",
        "[yellow]warn[/yellow]" if template_frac > 0.05 else "[green]clean[/green]",
    )
    tbl.add_row(
        "3. Question near-dup",
        str(result["question_near_dups"]),
        f"{question_frac:.1%}",
        "[yellow]warn[/yellow]" if question_frac > 0.15 else "[green]clean[/green]",
    )
    console.print(tbl)

    status_style = {"PASS": "green bold", "WARN": "yellow bold", "FAIL": "red bold"}[status]
    console.print(f"\n  [{status_style}]{status}[/{status_style}]")
    for rec in recommendations:
        console.print(f"  → {rec}")
    console.print()

    if output:
        write_json(output, result)

    return result
