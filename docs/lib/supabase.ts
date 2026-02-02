import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Client for browser (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (service key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database types
export interface Verification {
  id: string;
  user_id: string;
  content: string;
  content_hash: string;
  classification: 'HUMAN' | 'AI' | 'MIXED';
  ai_probability: number;
  confidence: number;
  platform?: string;
  platform_post_url?: string;
  created_at: string;
  metadata?: Record<string, any>;
}
