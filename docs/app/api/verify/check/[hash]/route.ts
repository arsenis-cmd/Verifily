import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const { hash } = params;

    if (!hash) {
      return NextResponse.json(
        { error: 'Missing hash parameter' },
        { status: 400 }
      );
    }

    // Try to find by content hash first
    let { data: verification, error } = await supabaseAdmin
      .from('verifications')
      .select('*')
      .eq('content_hash', hash)
      .single();

    // If not found by content hash, try by ID
    if (error && error.code === 'PGRST116') {
      const result = await supabaseAdmin
        .from('verifications')
        .select('*')
        .eq('id', hash)
        .single();

      verification = result.data;
      error = result.error;
    }

    if (error || !verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await supabaseAdmin
      .from('verifications')
      .update({ view_count: verification.view_count + 1 })
      .eq('id', verification.id);

    // Return verification data
    return NextResponse.json({
      content_hash: verification.content_hash,
      classification: verification.classification,
      ai_probability: verification.ai_probability,
      confidence: verification.confidence,
      view_count: verification.view_count + 1,
      verified_at: verification.verified_at,
      platform: verification.platform,
      post_url: verification.platform_post_url,
      username: verification.user_handle,
      shareable_url: verification.public_url,
      badge_url: verification.badge_url
    });

  } catch (error) {
    console.error('Check verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
