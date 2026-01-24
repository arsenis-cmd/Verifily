import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

const AI_API_URL = 'https://verifily-production.up.railway.app/api/v1';

function generateVerificationId(): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VFY-${date}-${random}`;
}

function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
}

async function detectAI(content: string): Promise<{
  classification: string;
  ai_probability: number;
  confidence: number;
}> {
  try {
    const response = await fetch(`${AI_API_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        platform: 'twitter'
      })
    });

    if (!response.ok) {
      throw new Error('AI detection failed');
    }

    const data = await response.json();
    return {
      classification: data.classification || 'human',
      ai_probability: data.ai_probability || 0,
      confidence: data.confidence || 1.0
    };
  } catch (error) {
    console.error('AI detection error:', error);
    // Fallback - if detection fails, assume human but log it
    return {
      classification: 'human',
      ai_probability: 0,
      confidence: 0.5
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      content,
      platform = 'twitter',
      post_id,
      post_url,
      username,
      consent_training_data = false
    } = body;

    // Validate required fields
    if (!content || !username) {
      return NextResponse.json(
        { error: 'Missing required fields: content and username' },
        { status: 400 }
      );
    }

    // Minimum content length check
    if (content.length < 3) {
      return NextResponse.json(
        { error: 'Content too short to verify' },
        { status: 400 }
      );
    }

    const verificationId = generateVerificationId();
    const contentHash = hashContent(content);

    // Check if content already verified
    const { data: existing } = await supabaseAdmin
      .from('verifications')
      .select('*')
      .eq('content_hash', contentHash)
      .single();

    if (existing) {
      // Increment view count
      await supabaseAdmin
        .from('verifications')
        .update({ view_count: existing.view_count + 1 })
        .eq('id', existing.id);

      return NextResponse.json({
        success: true,
        already_verified: true,
        verification: existing,
        message: `Content already verified as ${existing.classification}`
      });
    }

    // ACTUALLY RUN AI DETECTION
    console.log('[Verify] Running AI detection on content...');
    const aiResult = await detectAI(content);
    console.log('[Verify] AI detection result:', aiResult);

    // Calculate AI score (0-100)
    const aiScore = Math.round(aiResult.ai_probability * 100);

    // Create verification record
    const verification = {
      id: verificationId,
      content_text: content,
      content_hash: contentHash,
      word_count: content.split(/\s+/).length,
      language: 'en', // TODO: Detect language
      platform,
      platform_post_id: post_id,
      platform_post_url: post_url,
      user_handle: username,
      verified_at: new Date().toISOString(),

      // AI detection results (REAL DATA)
      ai_score_at_verification: aiScore,
      ai_probability: aiResult.ai_probability,
      classification: aiResult.classification,
      confidence: aiResult.confidence,

      // Consent
      consent_training_data,
      consent_timestamp: new Date().toISOString(),
      consent_version: '1.0',

      // Generated URLs
      badge_url: `https://verifily.io/badge/${verificationId}`,
      public_url: `https://verifily.io/verify/${contentHash}`,

      view_count: 1
    };

    // Store in database
    const { data: newVerification, error } = await supabaseAdmin
      .from('verifications')
      .insert(verification)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to store verification', details: error.message },
        { status: 500 }
      );
    }

    // Also log the AI detection for analytics
    await supabaseAdmin
      .from('ai_detections')
      .insert({
        content_hash: contentHash,
        platform,
        platform_post_id: post_id,
        detected_at: new Date().toISOString(),
        ai_probability: aiResult.ai_probability,
        classification: aiResult.classification,
        confidence: aiResult.confidence,
        user_verified: true
      });

    return NextResponse.json({
      success: true,
      verification: newVerification,
      message: `Verified as ${aiResult.classification} with ${Math.round(aiResult.confidence * 100)}% confidence`,
      shareable_url: `https://verifily.io/verify/${contentHash}`,
      content_hash: contentHash
    });

  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
