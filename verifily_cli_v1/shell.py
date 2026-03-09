"""Verifily Interactive Shell — REPL mode launched by `verifily` with no args."""

from __future__ import annotations

import os
import shlex
import sys
from pathlib import Path
from typing import List, Optional

import click
import typer
from rich.console import Console
from rich.panel import Panel

from verifily_cli_v1 import __version__

_HISTORY_PATH = Path.home() / ".verifily" / "history"
_BUILTINS = {"exit", "quit", "clear", "help"}


# ── Public entry point ──────────────────────────────────────────


def run_shell(typer_app: typer.Typer) -> None:
    """Launch the interactive Verifily shell."""
    os.environ["_VERIFILY_SHELL_ACTIVE"] = "1"
    console = Console()
    try:
        license_info = _resolve_license_quiet()
        _print_welcome(console, license_info)

        # Guided onboarding for first-time users
        from verifily_cli_v1.core.onboarding import needs_onboarding, run_onboarding
        if needs_onboarding():
            run_onboarding(console)

        click_app = typer.main.get_command(typer_app)
        command_names = _get_all_command_names(click_app)

        _run_prompt_loop(click_app, command_names, console)
    finally:
        os.environ.pop("_VERIFILY_SHELL_ACTIVE", None)


# ── Prompt loop ─────────────────────────────────────────────────


def _try_prompt_toolkit(
    click_app: click.BaseCommand,
    command_names: List[str],
    console: Console,
) -> bool:
    """Try to run the REPL with prompt_toolkit. Returns True if it ran, False to fallback."""
    try:
        from prompt_toolkit import PromptSession
        from prompt_toolkit.history import FileHistory
    except ImportError:
        return False

    if not sys.stdin.isatty():
        return False

    try:
        _HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
        completer = _make_completer(command_names)
        session: PromptSession[str] = PromptSession(
            history=FileHistory(str(_HISTORY_PATH)),
            completer=completer,
        )
        while True:
            try:
                line = session.prompt("verifily> ")
            except KeyboardInterrupt:
                continue
            except EOFError:
                console.print("\n[dim]Goodbye.[/dim]")
                break
            if _execute_line(line, click_app, console):
                console.print("[dim]Goodbye.[/dim]")
                break
        return True
    except Exception:
        return False


def _run_prompt_loop(
    click_app: click.BaseCommand,
    command_names: List[str],
    console: Console,
) -> None:
    """Run the REPL using prompt_toolkit if available, else plain input()."""
    if _try_prompt_toolkit(click_app, command_names, console):
        return
    # Fallback: plain input() loop
    while True:
        try:
            line = input("verifily> ")
        except KeyboardInterrupt:
            print()
            continue
        except EOFError:
            console.print("\n[dim]Goodbye.[/dim]")
            break
        if _execute_line(line, click_app, console):
            console.print("[dim]Goodbye.[/dim]")
            break


# ── Command execution ───────────────────────────────────────────


def _execute_line(
    line: str,
    click_app: click.BaseCommand,
    console: Console,
) -> bool:
    """Parse and execute a single input line. Returns True if the shell should exit."""
    line = line.strip()
    if not line:
        return False

    # Builtins
    lower = line.lower()
    if lower in ("exit", "quit"):
        return True
    if lower == "clear":
        os.system("cls" if sys.platform == "win32" else "clear")
        return False
    if lower == "help":
        _print_help(click_app, console)
        return False

    # Parse args
    try:
        args = shlex.split(line)
    except ValueError as exc:
        console.print(f"[red]Parse error:[/red] {exc}")
        return False

    # Execute via Click
    try:
        click_app.main(args, prog_name="verifily", standalone_mode=False)
    except SystemExit as exc:
        if exc.code and exc.code != 0:
            console.print(f"[yellow]Exit code {exc.code}[/yellow]")
    except click.UsageError as exc:
        console.print(f"[red]Usage error:[/red] {exc.format_message()}")
    except click.Abort:
        console.print("[yellow]Aborted.[/yellow]")
    except KeyboardInterrupt:
        console.print("\n[yellow]Interrupted.[/yellow]")
    except Exception as exc:
        console.print(f"[red bold]Error:[/red bold] {exc}")
    return False


# ── Command introspection ───────────────────────────────────────


def _get_all_command_names(click_app: click.BaseCommand) -> List[str]:
    """Walk the Click group tree and return all command names (including sub-app prefixed)."""
    names: List[str] = []
    if not isinstance(click_app, click.Group):
        return names
    for name, cmd in click_app.commands.items():
        names.append(name)
        if isinstance(cmd, click.Group):
            for sub_name in cmd.commands:
                names.append(f"{name} {sub_name}")
    return sorted(names)


# ── Tab completion ──────────────────────────────────────────────


def _make_completer(command_names: List[str]):
    """Build a prompt_toolkit completer that handles top-level and sub-app commands."""
    from prompt_toolkit.completion import Completer, Completion

    # Separate top-level names and sub-app mappings
    top_level = set()
    sub_commands: dict[str, list[str]] = {}
    for name in command_names:
        parts = name.split(" ", 1)
        top_level.add(parts[0])
        if len(parts) == 2:
            sub_commands.setdefault(parts[0], []).append(parts[1])

    all_top = sorted(top_level | _BUILTINS)

    class ShellCompleter(Completer):
        def get_completions(self, document, complete_event):
            text = document.text_before_cursor.lstrip()
            # Check if we're completing a sub-command
            for prefix, subs in sub_commands.items():
                if text.startswith(prefix + " "):
                    partial = text[len(prefix) + 1:]
                    for s in sorted(subs):
                        if s.startswith(partial):
                            yield Completion(s, start_position=-len(partial))
                    return
            # Top-level completion
            for cmd in all_top:
                if cmd.startswith(text):
                    yield Completion(cmd, start_position=-len(text))

    return ShellCompleter()


# ── Help ────────────────────────────────────────────────────────


def _print_help(click_app: click.BaseCommand, console: Console) -> None:
    """Show a compact list of available commands."""
    console.print("\n[bold]Available commands:[/bold]\n")
    if isinstance(click_app, click.Group):
        for name, cmd in sorted(click_app.commands.items()):
            short_help = cmd.get_short_help_str(limit=60)
            if isinstance(cmd, click.Group):
                sub_names = ", ".join(sorted(cmd.commands.keys()))
                console.print(f"  [cyan]{name}[/cyan]  {short_help}")
                console.print(f"    [dim]sub-commands: {sub_names}[/dim]")
            else:
                console.print(f"  [cyan]{name}[/cyan]  {short_help}")
    console.print()
    console.print("[dim]Builtins: help, clear, exit/quit[/dim]")
    console.print("[dim]Tab for completion, Ctrl+D to exit[/dim]\n")


# ── Welcome banner ──────────────────────────────────────────────


def _resolve_license_quiet() -> Optional[object]:
    """Try to resolve license info; return None on any error."""
    try:
        if os.environ.get("VERIFILY_TEST_MODE", "") == "1":
            return None
        from verifily_cli_v1.core.licensing import resolve_license, LicenseError
        return resolve_license()
    except Exception:
        return None


def _print_welcome(console: Console, license_info) -> None:
    """Print welcome banner with version and license status."""
    lines = [f"[bold]Verifily[/bold] v{__version__} — Interactive Shell"]

    if license_info is not None:
        tier_str = license_info.tier.value
        days = license_info.days_remaining
        if license_info.is_trial:
            lines.append(f"Tier: [cyan]{tier_str}[/cyan] (trial) | {days} days remaining")
        else:
            lines.append(f"Tier: [cyan]{tier_str}[/cyan] | {days} days remaining")
    else:
        lines.append("[dim]License: not configured[/dim]")

    lines.append('Type [bold]help[/bold] for commands, [bold]exit[/bold] to quit.')

    console.print(Panel("\n".join(lines), border_style="blue", padding=(0, 1)))
