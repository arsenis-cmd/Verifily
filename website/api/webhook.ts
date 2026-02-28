/**
 * Vercel Serverless Function: Stripe Webhook Handler
 *
 * POST /api/webhook
 *
 * Handles checkout.session.completed events.
 * Logs the purchase — license key delivery is handled by the success page.
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Vercel needs raw body for signature verification
export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return res.status(500).json({ error: 'Stripe webhook is not configured' });
  }

  const stripe = new Stripe(secretKey);

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('Checkout completed:', {
      email: session.customer_email,
      plan: session.metadata?.plan,
      subscription: session.subscription,
    });

    // License key is generated on the success page when the user lands there.
    // This webhook is for logging / future integrations (e.g., email delivery, CRM).
  }

  return res.status(200).json({ received: true });
}
