/**
 * Vercel Serverless Function: Post-Checkout Success Page
 *
 * GET /api/success?session_id=cs_...
 *
 * Retrieves the Stripe Checkout Session, generates a license key,
 * and returns an HTML page with the key + install instructions.
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY
 *   VERIFILY_PRIVATE_KEY
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { generateLicenseKey } from './generate-key.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).send(errorPage('Stripe is not configured.'));
  }

  const sessionId = req.query.session_id as string;
  if (!sessionId) {
    return res.status(400).send(errorPage('Missing session_id parameter.'));
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).send(errorPage('Payment has not been completed yet.'));
    }

    const email = session.customer_email || session.customer_details?.email || '';
    if (!email) {
      return res.status(400).send(errorPage('Could not determine customer email.'));
    }

    const { key } = generateLicenseKey(email, 'PRO');

    return res.status(200).send(successPage(key, email));
  } catch (err: any) {
    console.error('Success page error:', err.message);
    return res.status(500).send(errorPage('Failed to retrieve checkout session.'));
  }
}

function successPage(licenseKey: string, email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Successful - Verifily</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      max-width: 600px;
      width: 100%;
      text-align: center;
    }
    .check-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }
    .check-circle svg { width: 32px; height: 32px; color: white; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .subtitle { color: rgba(255,255,255,0.5); margin-bottom: 2rem; }
    .key-box {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      text-align: left;
    }
    .key-label { color: rgba(255,255,255,0.5); font-size: 0.875rem; margin-bottom: 0.5rem; }
    .key-value {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.8rem;
      color: #60a5fa;
      word-break: break-all;
      user-select: all;
      cursor: text;
      line-height: 1.5;
    }
    .copy-btn {
      display: inline-block;
      margin-top: 0.75rem;
      background: #334155;
      color: #fff;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;
    }
    .copy-btn:hover { background: #475569; }
    .steps {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: left;
    }
    .steps h3 { margin-bottom: 1rem; font-size: 1rem; }
    .step {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .step-num {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #fff;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }
    .step code {
      background: #0f172a;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.8rem;
      color: #a78bfa;
    }
    .step p { color: rgba(255,255,255,0.7); font-size: 0.875rem; line-height: 1.5; }
    .back-link {
      display: inline-block;
      margin-top: 2rem;
      color: rgba(255,255,255,0.4);
      text-decoration: none;
      font-size: 0.875rem;
    }
    .back-link:hover { color: rgba(255,255,255,0.7); }
  </style>
</head>
<body>
  <div class="container">
    <div class="check-circle">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h1>Payment successful!</h1>
    <p class="subtitle">Welcome to Verifily Pro, ${escapeHtml(email)}</p>

    <div class="key-box">
      <p class="key-label">Your license key</p>
      <p class="key-value" id="license-key">${escapeHtml(licenseKey)}</p>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('license-key').textContent);this.textContent='Copied!'">
        Copy to clipboard
      </button>
    </div>

    <div class="steps">
      <h3>Get started in 3 steps:</h3>
      <div class="step">
        <span class="step-num">1</span>
        <p>Install Verifily:<br /><code>pip install verifily</code></p>
      </div>
      <div class="step">
        <span class="step-num">2</span>
        <p>Activate your license:<br /><code>verifily login --key ${escapeHtml(licenseKey.slice(0, 20))}...</code></p>
      </div>
      <div class="step">
        <span class="step-num">3</span>
        <p>Verify it's working:<br /><code>verifily account</code></p>
      </div>
    </div>

    <a href="https://verifily.io" class="back-link">&larr; Back to verifily.io</a>
  </div>
</body>
</html>`;
}

function errorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Error - Verifily</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container { max-width: 500px; text-align: center; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    p { color: rgba(255,255,255,0.5); margin-bottom: 2rem; }
    a {
      color: #60a5fa;
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Something went wrong</h1>
    <p>${escapeHtml(message)}</p>
    <a href="https://verifily.io/#pricing">&larr; Back to pricing</a>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
