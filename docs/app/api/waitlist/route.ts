import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/waitlist
 *
 * Accepts email signups for the Verifily waitlist.
 * Previously backed by Supabase — now logs to console and
 * optionally sends a notification via Resend if configured.
 *
 * TODO: Replace with a production-grade storage backend
 * (database, CRM, etc.) when ready.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Log for now — replace with database insert in production
    console.log(`[waitlist] New signup: ${normalizedEmail}`);

    // Send notification if Resend is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Verifily <noreply@verifily.io>',
          to: process.env.NOTIFICATION_EMAIL || 'pilot@verifily.io',
          subject: 'New Waitlist Signup',
          html: `<p>New waitlist signup: <strong>${normalizedEmail}</strong></p>`,
        });
      } catch (emailErr) {
        console.error('[waitlist] Failed to send notification:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined waitlist',
    });
  } catch (error) {
    console.error('[waitlist] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
