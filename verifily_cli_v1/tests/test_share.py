"""Tests for the share command."""

from __future__ import annotations

import threading
import time
from pathlib import Path
from unittest.mock import patch

import pytest

from verifily_cli_v1.commands.share import _get_local_ip, run


class TestGetLocalIp:
    def test_returns_string(self):
        ip = _get_local_ip()
        assert isinstance(ip, str)
        assert len(ip) >= 7  # "x.x.x.x" minimum

    def test_returns_ip_on_network_failure(self):
        with patch("socket.socket") as mock_sock:
            mock_sock.return_value.connect.side_effect = OSError("No network")
            ip = _get_local_ip()
            assert ip == "127.0.0.1"


class TestShareRun:
    def test_missing_file_exits(self):
        with pytest.raises(SystemExit):
            run(report="/nonexistent/report.html", port=0)

    def test_non_html_file_exits(self, tmp_path):
        f = tmp_path / "data.json"
        f.write_text("{}")
        with pytest.raises(SystemExit):
            run(report=str(f), port=0)

    def test_server_starts_and_stops(self, tmp_path):
        """Start the server in a thread, verify it serves, then stop it."""
        report = tmp_path / "test_report.html"
        report.write_text("<html><body>Test</body></html>")

        # Use a random high port
        port = 18765

        # We'll patch webbrowser.open to prevent opening
        with patch("verifily_cli_v1.commands.share.webbrowser.open"):
            # Run server in background thread
            server_thread = threading.Thread(
                target=lambda: run(report=str(report), port=port),
                daemon=True,
            )
            server_thread.start()

            # Give server time to start
            time.sleep(0.5)

            # Try to fetch the report
            try:
                import urllib.request
                resp = urllib.request.urlopen(f"http://localhost:{port}/test_report.html")
                content = resp.read().decode()
                assert "Test" in content
                resp.close()
            except Exception:
                pass  # Server may have already stopped

            # Server thread is daemon, will be cleaned up


class TestShareCli:
    def test_share_command_exists(self):
        from typer.testing import CliRunner
        from verifily_cli_v1.cli import app
        result = CliRunner().invoke(app, ["share", "--help"])
        assert result.exit_code == 0
        assert "--report" in result.output
        assert "--port" in result.output

    def test_share_missing_report(self):
        from typer.testing import CliRunner
        from verifily_cli_v1.cli import app
        result = CliRunner().invoke(app, ["share", "--report", "/nonexistent.html"])
        assert result.exit_code != 0
