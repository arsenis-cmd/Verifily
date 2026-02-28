/**
 * Vercel Serverless Function: Create Stripe Checkout Session
 *
 * POST /api/create-checkout
 * Body: { "plan": "pro", "email"?: "user@company.com" }
 * Response: { "url": "https://checkout.stripe.com/..." }
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRICE_ID_PRO
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const proPriceId = process.env.STRIPE_PRICE_ID_PRO;

  if (!secretKey || !proPriceId) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  const stripe = new Stripe(secretKey);

  const { plan, email } = req.body ?? {};

  if (plan !== 'pro') {
    return res.status(400).json({ error: 'Only "pro" plan is available for checkout' });
  }

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: proPriceId, quantity: 1 }],
      success_url: `${getBaseUrl(req)}/api/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl(req)}/#pricing`,
      metadata: { plan: 'pro' },
    };

    if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}

function getBaseUrl(req: VercelRequest): string {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'verifily.io';
  return `${proto}://${host}`;
}
