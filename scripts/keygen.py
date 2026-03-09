#!/usr/bin/env python3
"""Verifily license key generator.

PRIVATE — do NOT ship this with the pip package.
Keep this in a private repo or on your local machine only.

Usage
-----
    # 1. Generate a new Ed25519 key pair (do this ONCE)
    python scripts/keygen.py generate-keys

    # 2. Copy the public key PEM into licensing.py _PUBLIC_KEY_PEM

    # 3. Issue a license key
    python scripts/keygen.py issue --tier PRO --org "Acme Corp" --expiry 2027-02-16

    # 4. Verify a key (for debugging)
    python scripts/keygen.py verify VFY-PRO-a1b2c3d4-20270216-<sig>
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import sys
import time
from pathlib import Path

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import (
        Ed25519PrivateKey,
        Ed25519PublicKey,
    )
    from cryptography.hazmat.primitives import serialization
except ImportError:
    print("ERROR: Install cryptography:  pip install cryptography")
    sys.exit(1)

KEYS_DIR = Path(__file__).parent / ".keys"


def cmd_generate_keys(args: argparse.Namespace) -> None:
    """Generate an Ed25519 key pair and write PEM files."""
    KEYS_DIR.mkdir(parents=True, exist_ok=True)

    priv_path = KEYS_DIR / "verifily_private.pem"
    pub_path = KEYS_DIR / "verifily_public.pem"

    if priv_path.exists() and not args.force:
        print(f"Private key already exists at {priv_path}")
        print("Use --force to overwrite.")
        sys.exit(1)

    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    priv_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    pub_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    priv_path.write_bytes(priv_pem)
    pub_path.write_bytes(pub_pem)

    # Restrict permissions on private key
    os.chmod(priv_path, 0o600)

    print(f"Private key: {priv_path}")
    print(f"Public key:  {pub_path}")
    print()
    print("=== PUBLIC KEY (paste into licensing.py _PUBLIC_KEY_PEM) ===")
    print(pub_pem.decode())
    print("=== END PUBLIC KEY ===")
    print()
    print("IMPORTANT: Keep the private key safe. Never commit it to git.")


def _load_private_key() -> Ed25519PrivateKey:
    priv_path = KEYS_DIR / "verifily_private.pem"
    if not priv_path.exists():
        print(f"Private key not found at {priv_path}")
        print("Run: python scripts/keygen.py generate-keys")
        sys.exit(1)
    pem = priv_path.read_bytes()
    return serialization.load_pem_private_key(pem, password=None)  # type: ignore[return-value]


def _load_public_key() -> Ed25519PublicKey:
    pub_path = KEYS_DIR / "verifily_public.pem"
    if not pub_path.exists():
        print(f"Public key not found at {pub_path}")
        print("Run: python scripts/keygen.py generate-keys")
        sys.exit(1)
    pem = pub_path.read_bytes()
    return serialization.load_pem_public_key(pem)  # type: ignore[return-value]


def cmd_issue(args: argparse.Namespace) -> None:
    """Issue a signed license key."""
    private_key = _load_private_key()

    tier = args.tier.upper()
    if tier not in ("FREE", "PRO", "ENTERPRISE"):
        print(f"Invalid tier: {tier}.  Choose FREE, PRO, or ENTERPRISE.")
        sys.exit(1)

    # Org hash: first 8 chars of SHA-256 of the org name
    org_hash = hashlib.sha256(args.org.encode()).hexdigest()[:8]

    # Expiry: YYYYMMDD
    expiry_str = args.expiry.replace("-", "")
    if len(expiry_str) != 8 or not expiry_str.isdigit():
        print(f"Invalid expiry: {args.expiry}.  Use YYYY-MM-DD format.")
        sys.exit(1)

    # Sign:  message = "TIER|org_hash|expiry"
    message = f"{tier}|{org_hash}|{expiry_str}".encode()
    signature = private_key.sign(message)
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")

    license_key = f"VFY-{tier}-{org_hash}-{expiry_str}-{sig_b64}"

    print(f"Organization: {args.org}")
    print(f"Org hash:     {org_hash}")
    print(f"Tier:         {tier}")
    print(f"Expiry:       {expiry_str[:4]}-{expiry_str[4:6]}-{expiry_str[6:8]}")
    print()
    print(f"License key:")
    print(f"  {license_key}")
    print()
    print("Activation:")
    print(f'  export VERIFILY_LICENSE_KEY="{license_key}"')
    print()
    print("Or save to file:")
    print(f'  echo \'{{"key": "{license_key}"}}\' > ~/.verifily/license.json')


def cmd_verify(args: argparse.Namespace) -> None:
    """Verify a license key against the public key."""
    public_key = _load_public_key()

    key = args.key.strip()
    parts = key.split("-")
    if len(parts) != 5 or parts[0] != "VFY":
        print("Invalid key format.  Expected VFY-TIER-ORG-EXPIRY-SIG")
        sys.exit(1)

    _, tier_str, org_hash, expiry_str, sig_b64 = parts
    message = f"{tier_str}|{org_hash}|{expiry_str}".encode()

    try:
        sig_bytes = base64.urlsafe_b64decode(sig_b64 + "==")
    except Exception:
        print("Invalid signature encoding.")
        sys.exit(1)

    try:
        public_key.verify(sig_bytes, message)
        print("Signature:  VALID")
    except Exception:
        print("Signature:  INVALID")
        sys.exit(1)

    print(f"Tier:       {tier_str}")
    print(f"Org hash:   {org_hash}")
    print(f"Expiry:     {expiry_str[:4]}-{expiry_str[4:6]}-{expiry_str[6:8]}")

    # Check expiry
    import datetime as _dt
    try:
        year, month, day = int(expiry_str[:4]), int(expiry_str[4:6]), int(expiry_str[6:8])
        expiry_dt = _dt.datetime(year, month, day, 23, 59, 59, tzinfo=_dt.timezone.utc)
        if time.time() > expiry_dt.timestamp():
            print("Status:     EXPIRED")
        else:
            remaining = int((expiry_dt.timestamp() - time.time()) / 86400)
            print(f"Status:     ACTIVE ({remaining} days remaining)")
    except ValueError:
        print("Status:     INVALID DATE")


def cmd_batch_issue(args: argparse.Namespace) -> None:
    """Issue multiple keys from a JSON file."""
    private_key = _load_private_key()

    data = json.loads(Path(args.file).read_text())
    results = []

    for entry in data:
        org = entry["org"]
        tier = entry.get("tier", "PRO").upper()
        expiry = entry["expiry"].replace("-", "")
        org_hash = hashlib.sha256(org.encode()).hexdigest()[:8]

        message = f"{tier}|{org_hash}|{expiry}".encode()
        signature = private_key.sign(message)
        sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")

        license_key = f"VFY-{tier}-{org_hash}-{expiry}-{sig_b64}"
        results.append({
            "org": org,
            "tier": tier,
            "expiry": expiry,
            "key": license_key,
        })
        print(f"{org} ({tier}): {license_key}")

    out_path = Path(args.file).with_suffix(".keys.json")
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\nKeys written to {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Verifily license key generator (PRIVATE tool)",
    )
    sub = parser.add_subparsers(dest="command")

    # generate-keys
    gen = sub.add_parser("generate-keys", help="Generate Ed25519 key pair")
    gen.add_argument("--force", action="store_true", help="Overwrite existing keys")

    # issue
    iss = sub.add_parser("issue", help="Issue a signed license key")
    iss.add_argument("--tier", required=True, help="FREE, PRO, or ENTERPRISE")
    iss.add_argument("--org", required=True, help="Organization name")
    iss.add_argument("--expiry", required=True, help="Expiry date (YYYY-MM-DD)")

    # verify
    ver = sub.add_parser("verify", help="Verify a license key")
    ver.add_argument("key", help="The license key to verify")

    # batch
    bat = sub.add_parser("batch", help="Issue keys from a JSON file")
    bat.add_argument("file", help="JSON file with [{org, tier, expiry}, ...]")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "generate-keys":
        cmd_generate_keys(args)
    elif args.command == "issue":
        cmd_issue(args)
    elif args.command == "verify":
        cmd_verify(args)
    elif args.command == "batch":
        cmd_batch_issue(args)


if __name__ == "__main__":
    main()
