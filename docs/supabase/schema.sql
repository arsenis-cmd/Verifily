-- Verifily Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- ORIGINAL VERIFILY PUBLIC VERIFICATION SYSTEM
-- ============================================

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

-- Indexes for performance (original system)
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

-- Row Level Security (RLS) - Original system
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

-- ============================================
-- NEW DASHBOARD USER VERIFICATION SYSTEM
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Verifications table (for dashboard - Clerk authenticated users)
CREATE TABLE IF NOT EXISTS user_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,  -- Clerk user ID
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('HUMAN', 'AI', 'MIXED')),
  ai_probability DECIMAL(5,4) NOT NULL,
  confidence DECIMAL(5,4) NOT NULL,
  platform TEXT,
  platform_post_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for dashboard verifications
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_created_at ON user_verifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_verifications_content_hash ON user_verifications(content_hash);
CREATE INDEX IF NOT EXISTS idx_user_verifications_classification ON user_verifications(classification);

-- Updated at trigger for dashboard verifications
CREATE OR REPLACE FUNCTION update_user_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_verifications_updated_at BEFORE UPDATE
    ON user_verifications FOR EACH ROW
    EXECUTE PROCEDURE update_user_verifications_updated_at();

-- RLS Policies for dashboard verifications
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verifications
CREATE POLICY "Users can view own user_verifications"
  ON user_verifications FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

-- Users can create their own verifications
CREATE POLICY "Users can create own user_verifications"
  ON user_verifications FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Users can update their own verifications
CREATE POLICY "Users can update own user_verifications"
  ON user_verifications FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id);

-- Users can delete their own verifications
CREATE POLICY "Users can delete own user_verifications"
  ON user_verifications FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);
