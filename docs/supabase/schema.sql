-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verifications table
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_created_at ON verifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verifications_content_hash ON verifications(content_hash);
CREATE INDEX IF NOT EXISTS idx_verifications_classification ON verifications(classification);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_verifications_updated_at BEFORE UPDATE
    ON verifications FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- RLS Policies
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verifications
CREATE POLICY "Users can view own verifications"
  ON verifications FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

-- Users can create their own verifications
CREATE POLICY "Users can create own verifications"
  ON verifications FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Users can update their own verifications
CREATE POLICY "Users can update own verifications"
  ON verifications FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id);

-- Users can delete their own verifications
CREATE POLICY "Users can delete own verifications"
  ON verifications FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);
