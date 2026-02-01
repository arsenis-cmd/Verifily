import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const AI_API_URL = 'https://verifily-production.up.railway.app/api/v1';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
}

async function detectAI(content: string): Promise<{
  classification: string;
  ai_probability: number;
  confidence: number;
  content_hash: string;
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

    // Map classification to database-allowed values
    let classification = data.classification || 'human';
    if (classification === 'uncertain') {
      classification = 'mixed';
    }

    return {
      classification,
      ai_probability: data.ai_probability || 0,
      confidence: data.confidence || 1.0,
      content_hash: data.content_hash || hashContent(content)
    };
  } catch (error) {
    console.error('AI detection error:', error);
    // Fallback
    return {
      classification: 'human',
      ai_probability: 0,
      confidence: 0.5,
      content_hash: hashContent(content)
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, platform = 'twitter' } = body;

    if (!content || content.length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Run AI detection
    const aiResult = await detectAI(content);

    return NextResponse.json({
      ...aiResult,
      platform,
      message: `Detected as ${aiResult.classification} with ${Math.round(aiResult.confidence * 100)}% confidence`
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Detection API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
