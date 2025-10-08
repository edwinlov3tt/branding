-- Migration: Add brand_intelligence table
-- Description: Store AI-extracted brand intelligence from website analysis
-- Created: 2025-10-08

-- Create brand_intelligence table
CREATE TABLE IF NOT EXISTS brand_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Core brand intelligence
  brand_name VARCHAR(255),
  tagline TEXT,
  mission TEXT,
  vision TEXT,
  values JSONB DEFAULT '[]',

  -- Brand voice and tone
  brand_tone TEXT,
  brand_voice JSONB DEFAULT '{}',
  messaging_themes JSONB DEFAULT '[]',

  -- Target market insights
  industry VARCHAR(255),
  target_market TEXT,
  unique_value_proposition TEXT,

  -- Content analysis
  key_messages JSONB DEFAULT '[]',
  content_themes JSONB DEFAULT '[]',

  -- Website analysis metadata
  pages_analyzed INTEGER DEFAULT 0,
  analysis_confidence DECIMAL(3,2),
  raw_analysis JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on brand_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_intelligence_brand_id ON brand_intelligence(brand_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_brand_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brand_intelligence_updated_at
  BEFORE UPDATE ON brand_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_intelligence_updated_at();

-- Add comments for documentation
COMMENT ON TABLE brand_intelligence IS 'AI-extracted brand intelligence from website analysis';
COMMENT ON COLUMN brand_intelligence.brand_tone IS 'Overall tone of brand communication (e.g., professional, friendly, innovative)';
COMMENT ON COLUMN brand_intelligence.brand_voice IS 'Brand voice attributes as JSON (e.g., {"formality": "casual", "enthusiasm": "high"})';
COMMENT ON COLUMN brand_intelligence.values IS 'Array of brand values extracted from content';
COMMENT ON COLUMN brand_intelligence.messaging_themes IS 'Key messaging themes found across the website';
COMMENT ON COLUMN brand_intelligence.analysis_confidence IS 'Confidence score of the AI analysis (0.00 to 1.00)';
