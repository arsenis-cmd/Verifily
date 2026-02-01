import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch verification from database
    const { data: verification, error } = await supabaseAdmin
      .from('verifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Generate certificate as SVG (which we'll convert to image on client side)
    const certificate = generateCertificateSVG(verification);

    return new NextResponse(certificate, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="verifily-certificate-${verification.id}.svg"`
      }
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}

function generateCertificateSVG(verification: any): string {
  const isHuman = verification.classification === 'human';
  const date = new Date(verification.verified_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#000000;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="800" fill="url(#bg)"/>

  <!-- Border -->
  <rect x="40" y="40" width="1120" height="720" fill="none" stroke="${isHuman ? '#10b981' : '#ef4444'}" stroke-width="4" rx="8"/>
  <rect x="50" y="50" width="1100" height="700" fill="none" stroke="${isHuman ? '#10b981' : '#ef4444'}" stroke-width="2" opacity="0.5" rx="8"/>

  <!-- Logo/Badge -->
  <circle cx="600" cy="150" r="60" fill="${isHuman ? '#10b981' : '#ef4444'}" opacity="0.2"/>
  <circle cx="600" cy="150" r="50" fill="${isHuman ? '#10b981' : '#ef4444'}" opacity="0.4"/>
  <text x="600" y="170" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">✓</text>

  <!-- Title -->
  <text x="600" y="260" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
    Certificate of Authenticity
  </text>

  <!-- Subtitle -->
  <text x="600" y="310" font-family="Arial, sans-serif" font-size="24" fill="#888888" text-anchor="middle">
    Human-Written Content Verification
  </text>

  <!-- Divider -->
  <line x1="300" y1="350" x2="900" y2="350" stroke="${isHuman ? '#10b981' : '#ef4444'}" stroke-width="2" opacity="0.5"/>

  <!-- Content -->
  <text x="600" y="420" font-family="Arial, sans-serif" font-size="20" fill="#cccccc" text-anchor="middle">
    This certifies that the content
  </text>

  <!-- Author -->
  <text x="600" y="470" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="${isHuman ? '#10b981' : '#ef4444'}" text-anchor="middle">
    by @${verification.user_handle || 'anonymous'}
  </text>

  <!-- Status -->
  <text x="600" y="520" font-family="Arial, sans-serif" font-size="20" fill="#cccccc" text-anchor="middle">
    has been verified as
  </text>

  <text x="600" y="570" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${isHuman ? '#10b981' : '#ef4444'}" text-anchor="middle" filter="url(#glow)">
    ${verification.classification.toUpperCase()}-WRITTEN
  </text>

  <!-- Stats -->
  <text x="400" y="640" font-family="Arial, sans-serif" font-size="16" fill="#888888" text-anchor="middle">
    AI Score: ${verification.ai_score_at_verification}%
  </text>
  <text x="600" y="640" font-family="Arial, sans-serif" font-size="16" fill="#888888" text-anchor="middle">
    Confidence: ${Math.round(verification.confidence * 100)}%
  </text>
  <text x="800" y="640" font-family="Arial, sans-serif" font-size="16" fill="#888888" text-anchor="middle">
    Views: ${verification.view_count}
  </text>

  <!-- Footer -->
  <text x="600" y="690" font-family="Arial, sans-serif" font-size="14" fill="#666666" text-anchor="middle">
    Verification ID: ${verification.id}
  </text>
  <text x="600" y="715" font-family="Arial, sans-serif" font-size="14" fill="#666666" text-anchor="middle">
    Verified on ${date} via Verifily.io
  </text>

  <!-- Watermark -->
  <text x="600" y="760" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" opacity="0.3" text-anchor="middle">
    VERIFILY
  </text>
</svg>`;
}
