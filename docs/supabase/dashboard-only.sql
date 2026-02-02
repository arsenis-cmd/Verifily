-- Dashboard User Verifications - NEW TABLE ONLY
-- Run this in your Supabase SQL Editor if original tables already exist

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

-- DISABLE RLS for user_verifications since we're using service role with Clerk auth
ALTER TABLE user_verifications DISABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own user_verifications" ON user_verifications;
DROP POLICY IF EXISTS "Users can create own user_verifications" ON user_verifications;
DROP POLICY IF EXISTS "Users can update own user_verifications" ON user_verifications;
DROP POLICY IF EXISTS "Users can delete own user_verifications" ON user_verifications;
