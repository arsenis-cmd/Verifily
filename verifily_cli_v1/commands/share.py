"""verifily share — serve an HTML report for team sharing."""

from __future__ import annotations

import socket
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

from rich.console import Console

console = Console(stderr=True)


def _get_local_ip() -> str:
    """Get the machine's local network IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
        finally:
            s.close()
    except Exception:
        return "127.0.0.1"


def _make_single_file_handler(file_path: Path):
    """Create a handler that serves only a single HTML file."""
    content = file_path.read_bytes()
    filename = file_path.name

    class SingleFileHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            # Only serve the exact report file (by name or root path)
            clean = self.path.split("?")[0].strip("/")
            if clean == filename or clean == "":
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            else:
                self.send_error(404, "Not Found")

        def log_message(self, format, *args):
            pass  # suppress request logs

    return SingleFileHandler


def run(*, report: str, port: int = 8765) -> None:
    """Serve an HTML report via local HTTP server for team sharing."""
    path = Path(report).resolve()

    if not path.exists():
        console.print(f"[red bold]Error:[/red bold] File not found: {path}")
        raise SystemExit(1)

    if not path.suffix == ".html":
        console.print(f"[red bold]Error:[/red bold] Expected an HTML file, got: {path.suffix}")
        raise SystemExit(1)

    filename = path.name
    local_ip = _get_local_ip()

    handler = _make_single_file_handler(path)

    try:
        server = HTTPServer(("0.0.0.0", port), handler)
    except OSError as e:
        console.print(f"[red bold]Error:[/red bold] Cannot start server on port {port}: {e}")
        raise SystemExit(1)

    console.print(f"\n[bold]Serving report:[/bold] {path.name}")
    console.print(f"\n  [cyan]Local:[/cyan]   http://localhost:{port}/{filename}")
    console.print(f"  [cyan]Network:[/cyan] http://{local_ip}:{port}/{filename}")
    console.print(f"\n[dim]Share the network URL with your team. Press Ctrl+C to stop.[/dim]\n")

    webbrowser.open(f"http://localhost:{port}/{filename}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        console.print("\n[yellow]Server stopped.[/yellow]")
    finally:
        server.server_close()
