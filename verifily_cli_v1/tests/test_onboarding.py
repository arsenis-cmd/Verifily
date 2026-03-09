"""Tests for the onboarding flow."""

from __future__ import annotations

import os
from pathlib import Path
from unittest.mock import patch

import pytest

from verifily_cli_v1.core.onboarding import (
    _FLAG_FILE,
    mark_onboarded,
    needs_onboarding,
    run_onboarding,
)


class TestNeedsOnboarding:
    def test_needs_onboarding_when_no_flag(self, tmp_path):
        flag = tmp_path / ".onboarded"
        with patch("verifily_cli_v1.core.onboarding._FLAG_FILE", flag), \
             patch.dict(os.environ, {"VERIFILY_TEST_MODE": ""}):
            assert needs_onboarding() is True

    def test_no_onboarding_when_flag_exists(self, tmp_path):
        flag = tmp_path / ".onboarded"
        flag.write_text("1")
        with patch("verifily_cli_v1.core.onboarding._FLAG_FILE", flag), \
             patch.dict(os.environ, {"VERIFILY_TEST_MODE": ""}):
            assert needs_onboarding() is False

    def test_no_onboarding_in_test_mode(self):
        with patch.dict(os.environ, {"VERIFILY_TEST_MODE": "1"}):
            assert needs_onboarding() is False


class TestMarkOnboarded:
    def test_creates_flag_file(self, tmp_path):
        flag = tmp_path / "sub" / ".onboarded"
        with patch("verifily_cli_v1.core.onboarding._FLAG_FILE", flag):
            mark_onboarded()
            assert flag.exists()
            assert flag.read_text() == "1"

    def test_idempotent(self, tmp_path):
        flag = tmp_path / ".onboarded"
        with patch("verifily_cli_v1.core.onboarding._FLAG_FILE", flag):
            mark_onboarded()
            mark_onboarded()
            assert flag.exists()


class TestRunOnboarding:
    def test_skips_on_no(self, tmp_path):
        from rich.console import Console
        flag = tmp_path / ".onboarded"
        console = Console(file=open(os.devnull, "w"))
        with patch("verifily_cli_v1.core.onboarding._FLAG_FILE", flag), \
             patch.dict(os.environ, {"VERIFILY_TEST_MODE": ""}), \
             patch("builtins.input", return_value="n"), \
             patch("sys.stdin") as mock_stdin:
            mock_stdin.isatty.return_value = True
            run_onboarding(console)
            assert flag.exists()  # marked even when skipped

    def test_runs_scaffold_and_report(self, tmp_path):
        from rich.console import Console
        from io import StringIO
        flag = tmp_path / ".onboarded"
        demo_dir = tmp_path / "demo"
        output = StringIO()
        console = Console(file=output)
        with patch("verifily_cli_v1.core.onboarding._FLAG_FILE", flag), \
             patch("verifily_cli_v1.core.onboarding._DEMO_DIR", demo_dir), \
             patch.dict(os.environ, {"VERIFILY_TEST_MODE": ""}), \
             patch("builtins.input", return_value="y"), \
             patch("sys.stdin") as mock_stdin, \
             patch("verifily_cli_v1.core.html_report.webbrowser.open"):
            mock_stdin.isatty.return_value = True
            run_onboarding(console)

            assert flag.exists()
            # Check scaffold happened
            assert (demo_dir / "data" / "raw" / "sample.csv").exists()
            # Check HTML was generated
            assert (demo_dir / "verifily_report.html").exists()

    def test_handles_scaffold_error_gracefully(self, tmp_path):
        from rich.console import Console
        flag = tmp_path / ".onboarded"
        console = Console(file=open(os.devnull, "w"))
        with patch("verifily_cli_v1.core.onboarding._FLAG_FILE", flag), \
             patch.dict(os.environ, {"VERIFILY_TEST_MODE": ""}), \
             patch("builtins.input", return_value="y"), \
             patch("sys.stdin") as mock_stdin, \
             patch("verifily_cli_v1.commands.quickstart.scaffold", side_effect=RuntimeError("fail")):
            mock_stdin.isatty.return_value = True
            # Should not raise
            run_onboarding(console)
            assert flag.exists()

    def test_non_tty_skips_prompt(self, tmp_path):
        from rich.console import Console
        flag = tmp_path / ".onboarded"
        demo_dir = tmp_path / "demo2"
        console = Console(file=open(os.devnull, "w"))
        with patch("verifily_cli_v1.core.onboarding._FLAG_FILE", flag), \
             patch("verifily_cli_v1.core.onboarding._DEMO_DIR", demo_dir), \
             patch.dict(os.environ, {"VERIFILY_TEST_MODE": ""}), \
             patch("sys.stdin") as mock_stdin, \
             patch("verifily_cli_v1.core.html_report.webbrowser.open"):
            mock_stdin.isatty.return_value = False
            run_onboarding(console)
            # Should run without prompting
            assert flag.exists()
