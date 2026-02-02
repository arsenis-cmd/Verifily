import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

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

    // Validate required fields
    if (!content || !classification || ai_probability === undefined || confidence === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
        classification,
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
      return NextResponse.json({ error: 'Failed to save verification' }, { status: 500 });
    }

    return NextResponse.json({ verification: data }, { status: 201 });
  } catch (error) {
    console.error('POST verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
