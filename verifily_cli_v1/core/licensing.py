"""Verifily license key verification.

License format:  VFY-<tier>-<org_hash>-<expiry_YYYYMMDD>-<signature>

Keys are signed with Ed25519.  The CLI ships with the public key;
the private key never leaves the licensor's machine.

Tiers
-----
FREE        Basic commands only (quickstart, init, doctor, version, etc.)
PRO         All FREE + contamination, pipeline, report, nl2sql, classify, PII,
            ingest (unlimited), integrations
ENTERPRISE  All PRO + serve, teams, RBAC, billing, audit, enterprise tokens

Trial
-----
First run creates ``~/.verifily/trial.json`` with a UTC timestamp.
All PRO features are unlocked for 14 days.  After trial expiry the
user must supply a valid license key or only FREE features are available.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import time
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Ed25519 helpers (cryptography is an optional dep; fall back to HMAC if
# absent so the module can still import for FREE-tier usage).
# ---------------------------------------------------------------------------

_HAS_ED25519 = False
try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import (
        Ed25519PublicKey,
    )
    from cryptography.hazmat.primitives import serialization
    _HAS_ED25519 = True
except ImportError:
    pass

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

LICENSE_PREFIX = "VFY"
TRIAL_DAYS = 14
VERIFILY_DIR = Path.home() / ".verifily"
TRIAL_FILE = VERIFILY_DIR / "trial.json"
LICENSE_FILE = VERIFILY_DIR / "license.json"

# Ed25519 public key (PEM).  Generated once; ships with the CLI.
# The matching private key is kept offline in scripts/keygen.py.
# Replace this with your actual public key after running keygen.
_PUBLIC_KEY_PEM = b"""-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAVVf/ywAG2nlIqv7kzXFrlLSfnlXOhpgS6IgQMLfeC48=
-----END PUBLIC KEY-----"""

# Set to True during test runs so licence checks are skipped.
_TEST_MODE = os.environ.get("VERIFILY_TEST_MODE", "") == "1"


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

class Tier(str, Enum):
    FREE = "FREE"
    PRO = "PRO"
    ENTERPRISE = "ENTERPRISE"

    def __ge__(self, other: "Tier") -> bool:
        order = {Tier.FREE: 0, Tier.PRO: 1, Tier.ENTERPRISE: 2}
        return order[self] >= order[other]

    def __gt__(self, other: "Tier") -> bool:
        order = {Tier.FREE: 0, Tier.PRO: 1, Tier.ENTERPRISE: 2}
        return order[self] > order[other]

    def __le__(self, other: "Tier") -> bool:
        order = {Tier.FREE: 0, Tier.PRO: 1, Tier.ENTERPRISE: 2}
        return order[self] <= order[other]

    def __lt__(self, other: "Tier") -> bool:
        order = {Tier.FREE: 0, Tier.PRO: 1, Tier.ENTERPRISE: 2}
        return order[self] < order[other]


@dataclass(frozen=True)
class LicenseInfo:
    """Verified license payload."""
    tier: Tier
    org_hash: str
    expiry_epoch: float
    is_trial: bool = False

    @property
    def expired(self) -> bool:
        return time.time() > self.expiry_epoch

    @property
    def days_remaining(self) -> int:
        remaining = (self.expiry_epoch - time.time()) / 86400
        return max(0, int(remaining))


class LicenseError(Exception):
    """Raised when a license check fails."""


# ---------------------------------------------------------------------------
# Public key loading
# ---------------------------------------------------------------------------

_cached_pubkey: Optional[object] = None


def _get_public_key() -> "Ed25519PublicKey":
    global _cached_pubkey
    if _cached_pubkey is not None:
        return _cached_pubkey  # type: ignore[return-value]
    if not _HAS_ED25519:
        raise LicenseError(
            "License verification requires the 'cryptography' package.\n"
            "Install it with: pip install cryptography"
        )
    # Allow overriding via env var (for testing / key rotation).
    pem = os.environ.get("VERIFILY_PUBLIC_KEY_PEM", "").encode() or _PUBLIC_KEY_PEM
    _cached_pubkey = serialization.load_pem_public_key(pem)
    return _cached_pubkey  # type: ignore[return-value]


def set_public_key_pem(pem: bytes) -> None:
    """Override the built-in public key (used in tests)."""
    global _cached_pubkey
    if not _HAS_ED25519:
        return
    _cached_pubkey = serialization.load_pem_public_key(pem)


def reset_public_key() -> None:
    """Reset the cached public key (used in tests)."""
    global _cached_pubkey
    _cached_pubkey = None


# ---------------------------------------------------------------------------
# License key parsing & verification
# ---------------------------------------------------------------------------

def parse_license_key(key: str) -> LicenseInfo:
    """Parse and cryptographically verify a license key string.

    Format: ``VFY-<tier>-<org_hash>-<expiry_YYYYMMDD>-<signature_b64url>``

    The signature may contain ``-`` characters (base64url), so we split on
    the first 4 dashes only.

    Raises:
        LicenseError: on any validation failure.
    """
    parts = key.strip().split("-", 4)
    if len(parts) != 5 or parts[0] != LICENSE_PREFIX:
        raise LicenseError(
            f"Invalid license key format.  Expected VFY-TIER-ORG-EXPIRY-SIG."
        )

    _, tier_str, org_hash, expiry_str, sig_b64 = parts

    # Tier
    try:
        tier = Tier(tier_str.upper())
    except ValueError:
        raise LicenseError(f"Unknown license tier: {tier_str}")

    # Expiry
    if len(expiry_str) != 8 or not expiry_str.isdigit():
        raise LicenseError(f"Invalid expiry date: {expiry_str}  (expected YYYYMMDD)")
    year, month, day = int(expiry_str[:4]), int(expiry_str[4:6]), int(expiry_str[6:8])
    import calendar
    import datetime as _dt
    try:
        expiry_dt = _dt.datetime(year, month, day, 23, 59, 59, tzinfo=_dt.timezone.utc)
    except ValueError:
        raise LicenseError(f"Invalid expiry date: {expiry_str}")
    expiry_epoch = expiry_dt.timestamp()

    # Signature verification
    message = f"{tier_str.upper()}|{org_hash}|{expiry_str}".encode()
    try:
        sig_bytes = base64.urlsafe_b64decode(sig_b64 + "==")  # re-pad
    except Exception:
        raise LicenseError("Invalid signature encoding.")

    try:
        pubkey = _get_public_key()
        pubkey.verify(sig_bytes, message)
    except LicenseError:
        raise
    except Exception:
        raise LicenseError("License signature verification failed.")

    info = LicenseInfo(tier=tier, org_hash=org_hash, expiry_epoch=expiry_epoch)

    if info.expired:
        raise LicenseError(
            f"License expired on {expiry_str[:4]}-{expiry_str[4:6]}-{expiry_str[6:8]}.  "
            "Please renew at https://verifily.io/renew"
        )

    return info


# ---------------------------------------------------------------------------
# Trial management
# ---------------------------------------------------------------------------

def _ensure_verifily_dir() -> None:
    VERIFILY_DIR.mkdir(parents=True, exist_ok=True)


def get_trial_info() -> Optional[LicenseInfo]:
    """Return trial LicenseInfo if trial is active, else None."""
    if not TRIAL_FILE.exists():
        return None
    try:
        data = json.loads(TRIAL_FILE.read_text())
        start_epoch = data.get("start_epoch", 0)
    except (json.JSONDecodeError, OSError):
        return None

    expiry_epoch = start_epoch + (TRIAL_DAYS * 86400)
    info = LicenseInfo(
        tier=Tier.PRO,
        org_hash="trial",
        expiry_epoch=expiry_epoch,
        is_trial=True,
    )
    if info.expired:
        return None
    return info


def start_trial() -> LicenseInfo:
    """Start a new trial.  Returns the trial LicenseInfo.

    If a trial already exists (even expired), returns None-like expired info
    to prevent trial resets.
    """
    if TRIAL_FILE.exists():
        existing = get_trial_info()
        if existing is not None:
            return existing
        raise LicenseError(
            "Your 14-day trial has expired.\n"
            "Upgrade to PRO at https://verifily.io/pricing"
        )

    _ensure_verifily_dir()
    start_epoch = time.time()
    TRIAL_FILE.write_text(json.dumps({
        "start_epoch": start_epoch,
        "version": "1",
    }))
    return LicenseInfo(
        tier=Tier.PRO,
        org_hash="trial",
        expiry_epoch=start_epoch + (TRIAL_DAYS * 86400),
        is_trial=True,
    )


# ---------------------------------------------------------------------------
# License resolution (key > env > file > trial)
# ---------------------------------------------------------------------------

def resolve_license(key: Optional[str] = None) -> LicenseInfo:
    """Resolve the active license from all sources.

    Priority:
    1. Explicit ``key`` argument
    2. ``VERIFILY_LICENSE_KEY`` env var
    3. ``~/.verifily/license.json`` file
    4. Active trial
    5. Start new trial (first run)

    Returns:
        LicenseInfo with the resolved tier.

    Raises:
        LicenseError: if no valid license or trial is available.
    """
    # 1. Explicit key
    if key:
        return parse_license_key(key)

    # 2. Env var
    env_key = os.environ.get("VERIFILY_LICENSE_KEY", "").strip()
    if env_key:
        return parse_license_key(env_key)

    # 3. License file
    if LICENSE_FILE.exists():
        try:
            data = json.loads(LICENSE_FILE.read_text())
            file_key = data.get("key", "").strip()
            if file_key:
                return parse_license_key(file_key)
        except (json.JSONDecodeError, OSError):
            pass

    # 4. Active trial
    trial = get_trial_info()
    if trial is not None:
        return trial

    # 5. Start new trial
    return start_trial()


# ---------------------------------------------------------------------------
# Command gating
# ---------------------------------------------------------------------------

# Commands that are always free (no license required).
FREE_COMMANDS = frozenset({
    "quickstart", "check", "init", "doctor", "version", "fingerprint",
    "diff-datasets", "diff_datasets", "contract-check", "contract_check",
    "ci-init", "ci_init", "badge", "history",
    "login", "account",
})

# Commands that require PRO or higher.
PRO_COMMANDS = frozenset({
    "contamination", "pipeline", "report", "classify",
    "ingest", "transform", "train", "eval", "eval_cmd",
    "compare", "reproduce", "security-check", "security_check",
    # NL2SQL
    "nl2sql", "nl2sql_validate", "nl2sql_fingerprint",
    "nl2sql_split", "nl2sql_gate",
    # Monitor (group + legacy flat names)
    "monitor",
    "monitor-start", "monitor_start", "monitor-stop", "monitor_stop",
    "monitor-status", "monitor_status", "monitor-history", "monitor_history",
    # Integrations
    "retrain",
})

# Commands that require ENTERPRISE.
ENTERPRISE_COMMANDS = frozenset({
    "serve",
    # Sub-app groups
    "admin", "billing", "ws",
    # Billing
    "billing-events", "billing_events", "billing-preview", "billing_preview",
    "billing-usage", "billing_usage", "plans", "estimate", "invoice",
    "usage-export", "usage_export", "checkout", "subscription",
    # Admin / Teams
    "whoami", "admin-org-create", "admin_org_create",
    "admin-user-create", "admin_user_create",
    "admin-member-add", "admin_member_add",
    "admin-team-project-create", "admin_team_project_create",
    "admin-key-issue", "admin_key_issue",
    "admin-project-create", "admin_project_create",
    "admin-key-create", "admin_key_create",
    "admin-key-list", "admin_key_list",
    "admin-key-disable", "admin_key_disable",
    "admin-key-rotate", "admin_key_rotate",
    # Enterprise security
    "registry",
    # Workspaces
    "ws-org-create", "ws_org_create",
    "ws-project-create", "ws_project_create",
    "ws-key-create", "ws_key_create",
    "ws-key-revoke", "ws_key_revoke",
    "ws-me", "ws_me",
    # Org mode
    "org-create", "org_create", "org-list", "org_list",
    "project-create", "project_create", "project-list", "project_list",
})


def required_tier(command_name: str) -> Tier:
    """Return the minimum tier required for a command."""
    name = command_name.replace("-", "_").lower()
    if name in {c.replace("-", "_") for c in FREE_COMMANDS}:
        return Tier.FREE
    if name in {c.replace("-", "_") for c in ENTERPRISE_COMMANDS}:
        return Tier.ENTERPRISE
    if name in {c.replace("-", "_") for c in PRO_COMMANDS}:
        return Tier.PRO
    # Unknown commands default to PRO (safe default).
    return Tier.PRO


def check_license(command_name: str, key: Optional[str] = None) -> LicenseInfo:
    """Check that the current license permits running *command_name*.

    Returns the LicenseInfo on success.
    Raises LicenseError with a user-friendly message on failure.
    """
    # Test mode bypasses all checks.
    if _TEST_MODE:
        return LicenseInfo(
            tier=Tier.ENTERPRISE,
            org_hash="test",
            expiry_epoch=time.time() + 86400 * 365,
        )

    needed = required_tier(command_name)

    # FREE commands never need a license.
    if needed == Tier.FREE:
        return LicenseInfo(tier=Tier.FREE, org_hash="free", expiry_epoch=0)

    # Resolve the license.
    info = resolve_license(key)

    if info.tier < needed:
        tier_name = needed.value
        raise LicenseError(
            f"The '{command_name}' command requires a {tier_name} license.\n"
            f"Your current license tier: {info.tier.value}"
            + (f" (trial, {info.days_remaining} days remaining)" if info.is_trial else "")
            + f"\n\nUpgrade at https://verifily.io/pricing"
        )

    return info


# ---------------------------------------------------------------------------
# CLI helpers
# ---------------------------------------------------------------------------

def save_license_key(key: str) -> LicenseInfo:
    """Validate a key and persist it to ``~/.verifily/license.json``."""
    info = parse_license_key(key)
    _ensure_verifily_dir()
    LICENSE_FILE.write_text(json.dumps({"key": key, "saved_at": time.time()}))
    return info


def license_status() -> dict:
    """Return a dict describing the current license state."""
    try:
        info = resolve_license()
        return {
            "status": "active",
            "tier": info.tier.value,
            "org": info.org_hash,
            "is_trial": info.is_trial,
            "days_remaining": info.days_remaining,
            "expired": info.expired,
        }
    except LicenseError as exc:
        return {
            "status": "inactive",
            "error": str(exc),
        }
