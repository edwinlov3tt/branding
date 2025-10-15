-- Migration: Add brand_profiles table
-- Description: Store comprehensive brand profile data from Brand Profiler API
-- Created: 2025-10-10

-- Create brand_profiles table to match Brand Profiler API response structure
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Job tracking (for async API calls)
  job_id VARCHAR(255),
  profile_status VARCHAR(50) DEFAULT 'completed', -- processing, completed, failed

  -- Brand information (from API: brandProfile.brand)
  brand_name VARCHAR(255),
  tagline TEXT,
  story TEXT,
  mission TEXT,
  positioning TEXT,
  value_props JSONB DEFAULT '[]', -- Array of value propositions

  -- Voice attributes (from API: brandProfile.voice)
  personality JSONB DEFAULT '[]', -- Array of personality traits
  tone_sliders JSONB DEFAULT '{}', -- Object with formal, playful, premium, technical, energetic (0-100)
  lexicon_preferred JSONB DEFAULT '[]', -- Array of preferred words/phrases
  lexicon_avoid JSONB DEFAULT '[]', -- Array of words/phrases to avoid

  -- Audience insights (from API: brandProfile.audience)
  primary_audience TEXT,
  audience_needs JSONB DEFAULT '[]', -- Array of audience needs
  audience_pain_points JSONB DEFAULT '[]', -- Array of pain points

  -- Writing guide (from API: brandProfile.writingGuide)
  sentence_length VARCHAR(50), -- short, medium, long
  paragraph_style TEXT,
  formatting_guidelines TEXT,
  writing_avoid JSONB DEFAULT '[]', -- Array of things to avoid in writing

  -- Analysis metadata (from API: insights)
  pages_crawled INTEGER DEFAULT 0,
  reviews_analyzed INTEGER DEFAULT 0,
  analysis_duration VARCHAR(50),
  review_sources JSONB DEFAULT '{}', -- Object with google, yelp, facebook counts
  confidence_score DECIMAL(3,2),

  -- Raw API response for reference
  raw_response JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on brand_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_profiles_brand_id ON brand_profiles(brand_id);

-- Create index on job_id for polling
CREATE INDEX IF NOT EXISTS idx_brand_profiles_job_id ON brand_profiles(job_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_brand_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_profiles_updated_at();

-- Add comments for documentation
COMMENT ON TABLE brand_profiles IS 'Comprehensive brand profile data from Brand Profiler API';
COMMENT ON COLUMN brand_profiles.job_id IS 'Job ID from Brand Profiler API for async tracking';
COMMENT ON COLUMN brand_profiles.tone_sliders IS 'Brand tone attributes (0-100 scale) for formal, playful, premium, technical, energetic';
COMMENT ON COLUMN brand_profiles.lexicon_preferred IS 'Words and phrases the brand prefers to use';
COMMENT ON COLUMN brand_profiles.lexicon_avoid IS 'Words and phrases the brand avoids';
COMMENT ON COLUMN brand_profiles.confidence_score IS 'Overall confidence score of the brand analysis (0.00 to 1.00)';
