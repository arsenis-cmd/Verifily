import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send notification to your email about new subscriber
    await resend.emails.send({
      from: 'Verifily <noreply@verifily.io>',
      to: process.env.NOTIFICATION_EMAIL || 'your-email@example.com',
      subject: 'New Newsletter Subscriber',
      html: `<p>New subscriber: <strong>${email}</strong></p>`,
    });

    // Optionally, send welcome email to subscriber
    await resend.emails.send({
      from: 'Verifily <noreply@verifily.io>',
      to: email,
      subject: 'Welcome to Verifily Newsletter',
      html: `
        <h2>Welcome to Verifily!</h2>
        <p>Thank you for subscribing to our newsletter. You'll receive updates on privacy-safe synthetic data, dataset transformation, and compliance tooling for ML teams.</p>
        <p>Stay tuned for product updates and early access to new capabilities.</p>
        <br/>
        <p>Best regards,<br/>The Verifily Team</p>
      `,
    });

    return NextResponse.json(
      { message: 'Successfully subscribed!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}
