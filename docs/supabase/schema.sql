-- Verifily Database Schema
-- Run this in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  twitter_handle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Consent tracking
  consent_training_data BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  consent_version TEXT DEFAULT '1.0',

  -- Stats
  total_verifications INTEGER DEFAULT 0,
  total_scans INTEGER DEFAULT 0
);

-- Verifications table (THE GOLD MINE)
CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY,

  -- Content (FULL TEXT STORED)
  content_text TEXT NOT NULL,
  content_hash TEXT NOT NULL UNIQUE,
  word_count INTEGER,
  language TEXT DEFAULT 'en',

  -- Platform info
  platform TEXT NOT NULL DEFAULT 'twitter',
  platform_post_id TEXT,
  platform_post_url TEXT,

  -- User info
  user_id UUID REFERENCES users(id),
  user_handle TEXT NOT NULL,
  user_email TEXT,

  -- Verification details
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ai_score_at_verification INTEGER NOT NULL,
  ai_probability DECIMAL(3,2),
  classification TEXT CHECK (classification IN ('human', 'ai', 'mixed')),
  confidence DECIMAL(3,2),

  -- Consent (LEGALLY CRITICAL)
  consent_training_data BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  consent_version TEXT NOT NULL DEFAULT '1.0',

  -- Generated assets
  badge_url TEXT,
  public_url TEXT,

  -- View tracking
  view_count INTEGER DEFAULT 1
);

-- Waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'extension',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Detection Logs (for tracking what we detect)
CREATE TABLE IF NOT EXISTS ai_detections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_hash TEXT NOT NULL,
  platform TEXT,
  platform_post_id TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ai_probability DECIMAL(3,2),
  classification TEXT,
  confidence DECIMAL(3,2),
  user_verified BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verifications_user_handle ON verifications(user_handle);
CREATE INDEX IF NOT EXISTS idx_verifications_hash ON verifications(content_hash);
CREATE INDEX IF NOT EXISTS idx_verifications_date ON verifications(verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_verifications_consent ON verifications(consent_training_data) WHERE consent_training_data = true;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(twitter_handle);
CREATE INDEX IF NOT EXISTS idx_ai_detections_hash ON ai_detections(content_hash);

-- Function to increment user verification count
CREATE OR REPLACE FUNCTION increment_user_verifications(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET total_verifications = total_verifications + 1
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- View for consented training data
CREATE OR REPLACE VIEW training_data AS
SELECT
  id,
  content_text,
  word_count,
  language,
  platform,
  verified_at,
  ai_score_at_verification,
  classification
FROM verifications
WHERE consent_training_data = true;

-- Row Level Security (RLS) - Optional but recommended
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Public read access to verifications (for public verification pages)
CREATE POLICY "Public verifications are viewable by everyone"
  ON verifications FOR SELECT
  USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role can insert verifications"
  ON verifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update verifications"
  ON verifications FOR UPDATE
  USING (true);
