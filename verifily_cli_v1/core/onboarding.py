"""verifily onboarding — guided first-run experience."""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

from rich.console import Console
from rich.panel import Panel

_FLAG_FILE = Path.home() / ".verifily" / ".onboarded"
_DEMO_DIR = Path(tempfile.gettempdir()) / "verifily-quickstart"


def needs_onboarding() -> bool:
    """Return True if the user has never completed onboarding."""
    if os.environ.get("VERIFILY_TEST_MODE", "") == "1":
        return False
    return not _FLAG_FILE.exists()


def mark_onboarded() -> None:
    """Write the onboarded flag so we don't show onboarding again."""
    _FLAG_FILE.parent.mkdir(parents=True, exist_ok=True)
    _FLAG_FILE.write_text("1")


def run_onboarding(console: Console) -> None:
    """Run the interactive guided onboarding flow."""
    console.print()
    console.print(Panel(
        "[bold]Welcome to Verifily![/bold]\n"
        "Let's get you started in 60 seconds.\n\n"
        "We'll create a sample project, run a quality check,\n"
        "and show you a live dashboard.",
        border_style="cyan",
        padding=(1, 2),
    ))

    # Ask permission
    if sys.stdin.isatty():
        try:
            answer = input("\nReady? (Y/n) ").strip().lower()
            if answer in ("n", "no"):
                console.print("[dim]Skipped. Run 'verifily quickstart' any time.[/dim]\n")
                mark_onboarded()
                return
        except (EOFError, KeyboardInterrupt):
            console.print()
            mark_onboarded()
            return

    # Step 1: Scaffold
    console.print("\n[bold cyan]Step 1/3[/bold cyan] Creating sample project...")
    try:
        from verifily_cli_v1.commands.quickstart import scaffold
        result = scaffold(str(_DEMO_DIR), force=True)
        console.print(f"  Created {len(result['created_paths'])} files in {_DEMO_DIR}")
    except Exception as e:
        console.print(f"  [red]Error: {e}[/red]")
        mark_onboarded()
        return

    # Step 2: Run report (use eval JSONL — dataset_report expects JSONL)
    console.print("\n[bold cyan]Step 2/3[/bold cyan] Running quality report...")
    try:
        from verifily_cli_v1.commands.report import dataset_report
        eval_path = _DEMO_DIR / "data" / "raw" / "eval.jsonl"
        report = dataset_report(str(eval_path), schema="sft", fast=True)
        q = report.get("quality", {})
        score = q.get("quality_score", 0)
        rows = report.get("row_count", 0)
        pii_label = "CLEAN" if report.get("pii_clean", True) else f"{report.get('pii_total_hits', 0)} hits"
        score_style = "green" if score >= 80 else "yellow" if score >= 50 else "red"
        console.print(
            f"  [{score_style}]Quality: {score}/100[/{score_style}] | "
            f"Rows: {rows} | PII: {pii_label}"
        )
    except Exception as e:
        console.print(f"  [red]Error: {e}[/red]")
        mark_onboarded()
        return

    # Step 3: Generate HTML report
    console.print("\n[bold cyan]Step 3/3[/bold cyan] Opening dashboard...")
    try:
        from verifily_cli_v1.core.html_report import write_html_report
        html_path = _DEMO_DIR / "verifily_report.html"
        write_html_report(
            {"report": report},
            html_path,
            open_browser=True,
            command="verifily quickstart",
        )
        console.print(f"  Dashboard opened: {html_path}")
    except Exception as e:
        console.print(f"  [red]Error: {e}[/red]")

    # Next steps
    console.print()
    console.print(Panel(
        "[bold]What's Next[/bold]\n\n"
        "1. [cyan]verifily report --dataset your_data.jsonl[/cyan]\n"
        "2. [cyan]verifily check your_data.jsonl --html[/cyan]\n"
        "3. [cyan]verifily watch --dataset your_data.jsonl --html[/cyan]\n"
        "4. [cyan]verifily share --report verifily_report.html[/cyan]\n"
        "5. Type [bold]help[/bold] for all commands",
        border_style="green",
        padding=(1, 2),
    ))

    mark_onboarded()
