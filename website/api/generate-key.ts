/**
 * Shared utility: Ed25519 license key generation.
 *
 * Mirrors the Python logic in scripts/keygen.py but in TypeScript
 * for use in Vercel serverless functions.
 *
 * Requires env var: VERIFILY_PRIVATE_KEY (Ed25519 private key in PEM format)
 */

import crypto from 'node:crypto';

export interface LicenseKeyResult {
  key: string;
  tier: string;
  orgHash: string;
  expiry: string;
}

/**
 * Generate a signed Verifily license key.
 *
 * Format: VFY-<TIER>-<org_hash>-<YYYYMMDD>-<ed25519_sig_b64url>
 * Message signed: "<TIER>|<org_hash>|<YYYYMMDD>"
 */
export function generateLicenseKey(
  email: string,
  tier: 'PRO' | 'ENTERPRISE' = 'PRO',
  expiryDate?: Date,
): LicenseKeyResult {
  const privateKeyPem = process.env.VERIFILY_PRIVATE_KEY;
  if (!privateKeyPem) {
    throw new Error('VERIFILY_PRIVATE_KEY env var is not set');
  }

  // Org hash: first 8 hex chars of SHA-256 of the email
  const orgHash = crypto.createHash('sha256').update(email).digest('hex').slice(0, 8);

  // Expiry: 1 month from now (matches monthly subscription billing cycle)
  const now = new Date();
  const expiry = expiryDate ?? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const expiryStr = expiry.toISOString().slice(0, 10).replace(/-/g, '');

  // Message to sign: "TIER|org_hash|YYYYMMDD"
  const message = Buffer.from(`${tier}|${orgHash}|${expiryStr}`);

  // Sign with Ed25519 private key
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const signature = crypto.sign(null, message, privateKey);

  // Base64url-encode the signature (strip trailing =)
  const sigB64 = signature.toString('base64url');

  const key = `VFY-${tier}-${orgHash}-${expiryStr}-${sigB64}`;

  return { key, tier, orgHash, expiry: expiryStr };
}
