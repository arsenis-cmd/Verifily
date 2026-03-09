"""Remote execution — route CLI commands through the Verifily cloud API.

When VERIFILY_API_URL is set (or --server is passed), paid commands
send data to the remote server instead of running algorithms locally.
This is the core of Layer 3 protection: algorithms only run on our
infrastructure, never shipped in the pip package.

The CLI uploads dataset file paths (for server-local mode) or dataset
content (for true cloud mode) and receives the result JSON back.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, Optional

# Cloud endpoint — only used when explicitly set via env var or --server flag.
# CLI runs locally by default; remote mode is opt-in.
DEFAULT_API_URL = os.environ.get("VERIFILY_API_URL", "")


def get_api_url(server: Optional[str] = None) -> Optional[str]:
    """Return the API URL if remote execution is configured.

    Returns None (= run locally) unless the user explicitly sets
    --server or the VERIFILY_API_URL env var.
    """
    return server or DEFAULT_API_URL or None


def remote_contamination(
    *,
    server: str,
    api_key: str,
    train_path: str,
    eval_path: str,
    jaccard_cutoff: float = 0.70,
) -> Dict[str, Any]:
    """Run contamination detection via the remote API.

    Uploads train and eval datasets, returns the result dict.
    """
    import httpx

    # Read the files and send as multipart
    train_data = Path(train_path).read_text()
    eval_data = Path(eval_path).read_text()

    url = f"{server.rstrip('/')}/v1/contamination"
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    body = {
        "train_data": train_data,
        "eval_data": eval_data,
        "jaccard_cutoff": jaccard_cutoff,
        "no_write": True,
    }

    resp = httpx.post(url, json=body, headers=headers, timeout=120.0)
    if resp.status_code != 200:
        error = resp.json().get("error", {})
        raise RuntimeError(
            f"Remote API error ({resp.status_code}): "
            f"{error.get('message', resp.text)}"
        )
    return resp.json()


def remote_pipeline(
    *,
    server: str,
    api_key: str,
    config_path: str,
    ci: bool = True,
) -> Dict[str, Any]:
    """Run pipeline via the remote API."""
    import httpx

    url = f"{server.rstrip('/')}/v1/pipeline"
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    body = {"config_path": config_path, "ci": ci}
    resp = httpx.post(url, json=body, headers=headers, timeout=120.0)
    if resp.status_code != 200:
        error = resp.json().get("error", {})
        raise RuntimeError(
            f"Remote API error ({resp.status_code}): "
            f"{error.get('message', resp.text)}"
        )
    return resp.json()


def remote_report(
    *,
    server: str,
    api_key: str,
    dataset_path: str,
    schema: str = "sft",
) -> Dict[str, Any]:
    """Run report via the remote API."""
    import httpx

    url = f"{server.rstrip('/')}/v1/report"
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    body = {"dataset_path": dataset_path, "schema": schema}
    resp = httpx.post(url, json=body, headers=headers, timeout=120.0)
    if resp.status_code != 200:
        error = resp.json().get("error", {})
        raise RuntimeError(
            f"Remote API error ({resp.status_code}): "
            f"{error.get('message', resp.text)}"
        )
    return resp.json()
