"""verifily watch — live file watcher with fast-mode quality feedback."""

from __future__ import annotations

import time
from pathlib import Path
from typing import Any, Dict, List

from rich.console import Console

console = Console(stderr=True)


def _get_file_mtime(path: Path) -> float:
    try:
        return path.stat().st_mtime
    except OSError:
        return 0.0


def _run_fast_check(dataset_path: Path, schema: str = "sft") -> Dict[str, Any]:
    from verifily_cli_v1.commands.report import dataset_report
    return dataset_report(str(dataset_path), schema=schema, fast=True)


def _compute_diff(prev: Dict[str, Any], curr: Dict[str, Any]) -> List[str]:
    diffs: List[str] = []

    prev_score = prev.get("quality", {}).get("quality_score", 0)
    curr_score = curr.get("quality", {}).get("quality_score", 0)
    if curr_score != prev_score:
        delta = curr_score - prev_score
        color = "green" if delta > 0 else "red"
        diffs.append(f"[{color}]Quality: {prev_score} -> {curr_score} ({delta:+d})[/{color}]")

    prev_rows = prev.get("row_count", 0)
    curr_rows = curr.get("row_count", 0)
    if curr_rows != prev_rows:
        diffs.append(f"Rows: {prev_rows} -> {curr_rows} ({curr_rows - prev_rows:+d})")

    prev_pii = prev.get("pii_total_hits", 0)
    curr_pii = curr.get("pii_total_hits", 0)
    if curr_pii != prev_pii:
        color = "red" if curr_pii > prev_pii else "green"
        diffs.append(f"[{color}]PII hits: {prev_pii} -> {curr_pii}[/{color}]")

    prev_issues = prev.get("quality", {}).get("issues", [])
    curr_issues = curr.get("quality", {}).get("issues", [])
    if len(curr_issues) != len(prev_issues):
        color = "red" if len(curr_issues) > len(prev_issues) else "green"
        diffs.append(f"[{color}]Issues: {len(prev_issues)} -> {len(curr_issues)}[/{color}]")

    prev_cats = {i.get("category", "") for i in prev_issues}
    curr_cats = {i.get("category", "") for i in curr_issues}
    for cat in curr_cats - prev_cats:
        diffs.append(f"[red]NEW issue: {cat}[/red]")
    for cat in prev_cats - curr_cats:
        diffs.append(f"[green]FIXED: {cat}[/green]")

    return diffs


def _print_status(result: Dict[str, Any], elapsed: float) -> None:
    q = result.get("quality", {})
    score = q.get("quality_score", 0)
    score_style = "green" if score >= 80 else "yellow" if score >= 50 else "red"
    pii_label = "CLEAN" if result.get("pii_clean", True) else f"{result.get('pii_total_hits', 0)} hits"
    console.print(
        f"  [{score_style}]Quality: {score}/100[/{score_style}] | "
        f"Rows: {result.get('row_count', 0)} | "
        f"PII: {pii_label} | "
        f"Issues: {len(q.get('issues', []))} | "
        f"{elapsed:.1f}s"
    )


def run(
    *,
    dataset: str,
    schema: str = "sft",
    interval: float = 1.0,
    html: bool = False,
) -> None:
    """Watch a dataset file and re-run fast checks on modification."""
    path = Path(dataset)
    if not path.exists():
        console.print(f"[red bold]Error:[/red bold] File not found: {path}")
        raise SystemExit(1)

    console.print(f"\n[bold]Watching:[/bold] {path}")
    console.print(f"[dim]Polling every {interval}s | Press Ctrl+C to stop[/dim]\n")

    last_mtime = _get_file_mtime(path)
    t0 = time.monotonic()
    last_result = _run_fast_check(path, schema=schema)
    _print_status(last_result, time.monotonic() - t0)

    if html:
        from verifily_cli_v1.core.html_report import write_html_report
        html_path = path.parent / "verifily_report.html"
        reload_sec = int(interval) + 1
        write_html_report({"report": last_result}, html_path, open_browser=True,
                          command=f"verifily watch --dataset {dataset}",
                          live_reload=reload_sec)
        console.print(f"  [dim]Auto-refresh: every {reload_sec}s[/dim]")

    change_count = 0

    try:
        while True:
            time.sleep(interval)
            current_mtime = _get_file_mtime(path)
            if current_mtime <= last_mtime:
                continue

            last_mtime = current_mtime
            change_count += 1
            console.print(f"\n[bold cyan]Change #{change_count}[/bold cyan] at {time.strftime('%H:%M:%S')}")

            t0 = time.monotonic()
            try:
                result = _run_fast_check(path, schema=schema)
            except Exception as e:
                console.print(f"  [red]Error: {e}[/red]")
                continue

            _print_status(result, time.monotonic() - t0)

            diffs = _compute_diff(last_result, result)
            if diffs:
                for d in diffs:
                    console.print(f"    {d}")
            else:
                console.print(f"    [dim]No metric changes[/dim]")

            if html:
                from verifily_cli_v1.core.html_report import write_html_report
                html_path = path.parent / "verifily_report.html"
                write_html_report({"report": result}, html_path, open_browser=False,
                                  command=f"verifily watch --dataset {dataset}",
                                  live_reload=int(interval) + 1)
                console.print(f"    [dim]HTML updated: {html_path}[/dim]")

            last_result = result

    except KeyboardInterrupt:
        console.print(f"\n[yellow]Stopped. {change_count} changes detected.[/yellow]")
