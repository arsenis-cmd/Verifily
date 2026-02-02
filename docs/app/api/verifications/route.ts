import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// Normalize classification to match database constraint
function normalizeClassification(classification: string): 'HUMAN' | 'AI' | 'MIXED' {
  const normalized = classification.toUpperCase().trim();

  // Map common variations to standard values
  if (normalized === 'HUMAN' || normalized === 'HUMAN-GENERATED' || normalized === 'REAL') {
    return 'HUMAN';
  }
  if (normalized === 'AI' || normalized === 'AI-GENERATED' || normalized === 'ARTIFICIAL') {
    return 'AI';
  }
  if (normalized === 'MIXED' || normalized === 'HYBRID' || normalized === 'PARTIAL') {
    return 'MIXED';
  }

  // Default to MIXED for unknown classifications
  console.warn(`Unknown classification "${classification}", defaulting to MIXED`);
  return 'MIXED';
}

// GET - Fetch user's verifications
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data, error } = await supabaseAdmin
      .from('user_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching verifications:', error);
      return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 });
    }

    return NextResponse.json({ verifications: data || [] });
  } catch (error) {
    console.error('GET verifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save a new verification
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      content,
      classification,
      ai_probability,
      confidence,
      platform,
      platform_post_url,
      metadata
    } = body;

    // Log incoming data for debugging
    console.log('Received verification data:', {
      classification,
      ai_probability,
      confidence,
      platform,
      content_length: content?.length
    });

    // Validate required fields
    if (!content || !classification || ai_probability === undefined || confidence === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Normalize classification to match database constraint
    const normalizedClassification = normalizeClassification(classification);
    console.log(`Normalized classification from "${classification}" to "${normalizedClassification}"`);

    // Generate content hash
    const content_hash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
      .substring(0, 16);

    // Insert verification
    const { data, error } = await supabaseAdmin
      .from('user_verifications')
      .insert({
        user_id: userId,
        content,
        content_hash,
        classification: normalizedClassification,
        ai_probability,
        confidence,
        platform,
        platform_post_url,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving verification:', error);
      return NextResponse.json({
        error: 'Failed to save verification',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ verification: data }, { status: 201 });
  } catch (error) {
    console.error('POST verification error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
