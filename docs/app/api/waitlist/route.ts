import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source = 'extension' } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from('waitlist')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Already on waitlist',
        already_exists: true
      });
    }

    // Add to waitlist
    const { data, error } = await supabaseAdmin
      .from('waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        source,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Waitlist error:', error);
      return NextResponse.json(
        { error: 'Failed to join waitlist', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined waitlist',
      data
    });

  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
