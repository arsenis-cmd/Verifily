"""Tests for verifily_cli_v1.core.licensing — license key gating.

Run:  VERIFILY_TEST_MODE=1 pytest verifily_cli_v1/tests/test_licensing.py -v
"""

from __future__ import annotations

import base64
import json
import os
import time
from pathlib import Path
from unittest.mock import patch

import pytest

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

from verifily_cli_v1.core.licensing import (
    Tier,
    LicenseInfo,
    LicenseError,
    parse_license_key,
    check_license,
    resolve_license,
    get_trial_info,
    start_trial,
    save_license_key,
    license_status,
    required_tier,
    set_public_key_pem,
    reset_public_key,
    FREE_COMMANDS,
    PRO_COMMANDS,
    ENTERPRISE_COMMANDS,
    TRIAL_DAYS,
)


# ── Test key pair ──────────────────────────────────────────────

@pytest.fixture(scope="module")
def keypair():
    """Generate a fresh Ed25519 key pair for testing."""
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    pub_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_key, public_key, pub_pem


@pytest.fixture(autouse=True)
def setup_test_key(keypair, tmp_path, monkeypatch):
    """Set the test public key and isolate file system."""
    _, _, pub_pem = keypair
    set_public_key_pem(pub_pem)

    # Isolate trial/license files to tmp_path
    monkeypatch.setattr("verifily_cli_v1.core.licensing.VERIFILY_DIR", tmp_path)
    monkeypatch.setattr("verifily_cli_v1.core.licensing.TRIAL_FILE", tmp_path / "trial.json")
    monkeypatch.setattr("verifily_cli_v1.core.licensing.LICENSE_FILE", tmp_path / "license.json")

    # Ensure test mode is OFF so we actually test licensing logic
    monkeypatch.setattr("verifily_cli_v1.core.licensing._TEST_MODE", False)
    monkeypatch.delenv("VERIFILY_LICENSE_KEY", raising=False)

    yield
    reset_public_key()


def _sign_key(private_key: Ed25519PrivateKey, tier: str, org_hash: str, expiry: str) -> str:
    """Issue a test license key."""
    message = f"{tier}|{org_hash}|{expiry}".encode()
    sig = private_key.sign(message)
    sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")
    return f"VFY-{tier}-{org_hash}-{expiry}-{sig_b64}"


# ── Tier ordering ─────────────────────────────────────────────

class TestTierOrdering:
    def test_free_lt_pro(self):
        assert Tier.FREE < Tier.PRO

    def test_pro_lt_enterprise(self):
        assert Tier.PRO < Tier.ENTERPRISE

    def test_enterprise_ge_pro(self):
        assert Tier.ENTERPRISE >= Tier.PRO

    def test_free_le_free(self):
        assert Tier.FREE <= Tier.FREE

    def test_pro_not_gt_enterprise(self):
        assert not (Tier.PRO > Tier.ENTERPRISE)


# ── Key parsing ────────────────────────────────────────────────

class TestParseKey:
    def test_valid_pro_key(self, keypair):
        priv, _, _ = keypair
        key = _sign_key(priv, "PRO", "abc12345", "20270216")
        info = parse_license_key(key)
        assert info.tier == Tier.PRO
        assert info.org_hash == "abc12345"
        assert not info.expired
        assert info.days_remaining > 0

    def test_valid_enterprise_key(self, keypair):
        priv, _, _ = keypair
        key = _sign_key(priv, "ENTERPRISE", "xyz99999", "20280101")
        info = parse_license_key(key)
        assert info.tier == Tier.ENTERPRISE

    def test_valid_free_key(self, keypair):
        priv, _, _ = keypair
        key = _sign_key(priv, "FREE", "free0001", "20270216")
        info = parse_license_key(key)
        assert info.tier == Tier.FREE

    def test_expired_key_raises(self, keypair):
        priv, _, _ = keypair
        key = _sign_key(priv, "PRO", "abc12345", "20200101")
        with pytest.raises(LicenseError, match="expired"):
            parse_license_key(key)

    def test_invalid_format_raises(self):
        with pytest.raises(LicenseError, match="Invalid license key format"):
            parse_license_key("not-a-valid-key")

    def test_wrong_prefix_raises(self):
        with pytest.raises(LicenseError, match="Invalid license key format"):
            parse_license_key("XYZ-PRO-abc-20270216-sig")

    def test_bad_tier_raises(self, keypair):
        priv, _, _ = keypair
        # Manually construct with bad tier (won't verify, but tier check comes first)
        with pytest.raises(LicenseError):
            parse_license_key("VFY-ULTRA-abc12345-20270216-badsig")

    def test_bad_expiry_raises(self, keypair):
        priv, _, _ = keypair
        with pytest.raises(LicenseError):
            parse_license_key("VFY-PRO-abc12345-2027021-badsig")

    def test_tampered_signature_raises(self, keypair):
        priv, _, _ = keypair
        key = _sign_key(priv, "PRO", "abc12345", "20270216")
        # Tamper with the signature
        parts = key.split("-", 4)
        parts[4] = "A" + parts[4][1:]  # flip first char
        tampered = "-".join(parts)
        with pytest.raises(LicenseError, match="signature"):
            parse_license_key(tampered)

    def test_tampered_tier_raises(self, keypair):
        priv, _, _ = keypair
        key = _sign_key(priv, "FREE", "abc12345", "20270216")
        # Change FREE to PRO but keep original signature
        tampered = key.replace("VFY-FREE-", "VFY-PRO-", 1)
        with pytest.raises(LicenseError, match="signature"):
            parse_license_key(tampered)


# ── Trial management ──────────────────────────────────────────

class TestTrial:
    def test_no_trial_initially(self, tmp_path):
        assert get_trial_info() is None

    def test_start_trial(self, tmp_path):
        info = start_trial()
        assert info.tier == Tier.PRO
        assert info.is_trial
        assert info.days_remaining >= TRIAL_DAYS - 1
        assert not info.expired

    def test_trial_persists(self, tmp_path):
        start_trial()
        info = get_trial_info()
        assert info is not None
        assert info.is_trial

    def test_expired_trial_returns_none(self, tmp_path):
        # Write a trial that started 30 days ago
        trial_file = tmp_path / "trial.json"
        trial_file.write_text(json.dumps({
            "start_epoch": time.time() - 86400 * 30,
            "version": "1",
        }))
        assert get_trial_info() is None

    def test_cannot_restart_expired_trial(self, tmp_path):
        trial_file = tmp_path / "trial.json"
        trial_file.write_text(json.dumps({
            "start_epoch": time.time() - 86400 * 30,
            "version": "1",
        }))
        with pytest.raises(LicenseError, match="trial has expired"):
            start_trial()

    def test_start_trial_idempotent(self, tmp_path):
        info1 = start_trial()
        info2 = start_trial()
        assert info1.expiry_epoch == info2.expiry_epoch


# ── License resolution ────────────────────────────────────────

class TestResolve:
    def test_explicit_key_wins(self, keypair, tmp_path):
        priv, _, _ = keypair
        key = _sign_key(priv, "ENTERPRISE", "abc12345", "20270216")
        # Start a trial (PRO)
        start_trial()
        # Explicit key should win over trial
        info = resolve_license(key=key)
        assert info.tier == Tier.ENTERPRISE
        assert not info.is_trial

    def test_env_var_wins_over_file(self, keypair, tmp_path, monkeypatch):
        priv, _, _ = keypair
        pro_key = _sign_key(priv, "PRO", "pro00001", "20270216")
        ent_key = _sign_key(priv, "ENTERPRISE", "ent00001", "20270216")

        # Save PRO to file
        license_file = tmp_path / "license.json"
        license_file.write_text(json.dumps({"key": pro_key}))

        # Set ENTERPRISE in env
        monkeypatch.setenv("VERIFILY_LICENSE_KEY", ent_key)

        info = resolve_license()
        assert info.tier == Tier.ENTERPRISE

    def test_file_key_used(self, keypair, tmp_path):
        priv, _, _ = keypair
        key = _sign_key(priv, "PRO", "abc12345", "20270216")
        license_file = tmp_path / "license.json"
        license_file.write_text(json.dumps({"key": key}))

        info = resolve_license()
        assert info.tier == Tier.PRO
        assert not info.is_trial

    def test_trial_auto_starts(self, tmp_path):
        info = resolve_license()
        assert info.tier == Tier.PRO
        assert info.is_trial

    def test_expired_trial_raises(self, tmp_path):
        trial_file = tmp_path / "trial.json"
        trial_file.write_text(json.dumps({
            "start_epoch": time.time() - 86400 * 30,
            "version": "1",
        }))
        with pytest.raises(LicenseError, match="trial has expired"):
            resolve_license()


# ── Command gating ────────────────────────────────────────────

class TestCommandGating:
    def test_free_commands_need_free(self):
        for cmd in ["quickstart", "init", "doctor", "version", "fingerprint",
                     "diff-datasets", "contract-check", "ci-init", "login", "account"]:
            assert required_tier(cmd) == Tier.FREE

    def test_pro_commands_need_pro(self):
        for cmd in ["contamination", "pipeline", "report", "classify",
                     "ingest", "nl2sql"]:
            assert required_tier(cmd) == Tier.PRO

    def test_enterprise_commands_need_enterprise(self):
        for cmd in ["serve", "billing-events", "whoami", "admin-org-create"]:
            assert required_tier(cmd) == Tier.ENTERPRISE

    def test_unknown_defaults_to_pro(self):
        assert required_tier("some-unknown-command") == Tier.PRO

    def test_free_command_no_license_needed(self, tmp_path):
        # Even with no trial, no key — free commands pass
        trial_file = tmp_path / "trial.json"
        trial_file.write_text(json.dumps({
            "start_epoch": time.time() - 86400 * 30,
            "version": "1",
        }))
        info = check_license("version")
        assert info.tier == Tier.FREE

    def test_pro_command_with_trial(self, tmp_path):
        info = check_license("contamination")
        assert info.tier == Tier.PRO
        assert info.is_trial

    def test_pro_command_expired_trial_blocks(self, tmp_path):
        trial_file = tmp_path / "trial.json"
        trial_file.write_text(json.dumps({
            "start_epoch": time.time() - 86400 * 30,
            "version": "1",
        }))
        with pytest.raises(LicenseError, match="trial has expired"):
            check_license("contamination")

    def test_enterprise_command_with_pro_key_blocks(self, keypair, tmp_path):
        priv, _, _ = keypair
        key = _sign_key(priv, "PRO", "abc12345", "20270216")
        with pytest.raises(LicenseError, match="ENTERPRISE"):
            check_license("serve", key=key)

    def test_enterprise_command_with_enterprise_key_passes(self, keypair, tmp_path):
        priv, _, _ = keypair
        key = _sign_key(priv, "ENTERPRISE", "abc12345", "20270216")
        info = check_license("serve", key=key)
        assert info.tier == Tier.ENTERPRISE

    def test_test_mode_bypasses_all(self, monkeypatch, tmp_path):
        monkeypatch.setattr("verifily_cli_v1.core.licensing._TEST_MODE", True)
        # Expired trial, no key — should still pass
        trial_file = tmp_path / "trial.json"
        trial_file.write_text(json.dumps({
            "start_epoch": time.time() - 86400 * 30,
            "version": "1",
        }))
        info = check_license("serve")
        assert info.tier == Tier.ENTERPRISE


# ── Save / status ─────────────────────────────────────────────

class TestSaveAndStatus:
    def test_save_license_key(self, keypair, tmp_path):
        priv, _, _ = keypair
        key = _sign_key(priv, "PRO", "abc12345", "20270216")
        info = save_license_key(key)
        assert info.tier == Tier.PRO

        # Verify file was written
        license_file = tmp_path / "license.json"
        assert license_file.exists()
        data = json.loads(license_file.read_text())
        assert data["key"] == key

    def test_license_status_active(self, keypair, tmp_path):
        priv, _, _ = keypair
        key = _sign_key(priv, "PRO", "abc12345", "20270216")
        save_license_key(key)
        status = license_status()
        assert status["status"] == "active"
        assert status["tier"] == "PRO"
        assert not status["is_trial"]

    def test_license_status_trial(self, tmp_path):
        status = license_status()
        assert status["status"] == "active"
        assert status["tier"] == "PRO"
        assert status["is_trial"]

    def test_license_status_inactive(self, tmp_path):
        trial_file = tmp_path / "trial.json"
        trial_file.write_text(json.dumps({
            "start_epoch": time.time() - 86400 * 30,
            "version": "1",
        }))
        status = license_status()
        assert status["status"] == "inactive"
        assert "error" in status


# ── LicenseInfo properties ────────────────────────────────────

class TestLicenseInfo:
    def test_expired_property(self):
        info = LicenseInfo(tier=Tier.PRO, org_hash="x", expiry_epoch=time.time() - 1)
        assert info.expired

    def test_not_expired(self):
        info = LicenseInfo(tier=Tier.PRO, org_hash="x", expiry_epoch=time.time() + 86400)
        assert not info.expired

    def test_days_remaining(self):
        info = LicenseInfo(tier=Tier.PRO, org_hash="x", expiry_epoch=time.time() + 86400 * 10)
        assert 9 <= info.days_remaining <= 10

    def test_days_remaining_expired(self):
        info = LicenseInfo(tier=Tier.PRO, org_hash="x", expiry_epoch=time.time() - 86400)
        assert info.days_remaining == 0


# ── Command set coverage ──────────────────────────────────────

class TestCommandSets:
    def test_no_overlap_free_pro(self):
        normalized_free = {c.replace("-", "_") for c in FREE_COMMANDS}
        normalized_pro = {c.replace("-", "_") for c in PRO_COMMANDS}
        assert normalized_free.isdisjoint(normalized_pro)

    def test_no_overlap_free_enterprise(self):
        normalized_free = {c.replace("-", "_") for c in FREE_COMMANDS}
        normalized_ent = {c.replace("-", "_") for c in ENTERPRISE_COMMANDS}
        assert normalized_free.isdisjoint(normalized_ent)

    def test_no_overlap_pro_enterprise(self):
        normalized_pro = {c.replace("-", "_") for c in PRO_COMMANDS}
        normalized_ent = {c.replace("-", "_") for c in ENTERPRISE_COMMANDS}
        assert normalized_pro.isdisjoint(normalized_ent)
