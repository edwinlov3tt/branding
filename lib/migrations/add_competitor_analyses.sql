-- Migration: Add competitor_analyses table
-- Description: Store comprehensive AI-powered competitor ad analyses
-- Created: 2025-10-08

-- Create competitor_analyses table
CREATE TABLE IF NOT EXISTS competitor_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,

  -- Competitor identification
  competitor_name VARCHAR(255) NOT NULL,
  competitor_website VARCHAR(500),
  facebook_page VARCHAR(500),

  -- Ad data from Foreplay
  total_ads_analyzed INTEGER DEFAULT 0,
  ad_ids JSONB DEFAULT '[]',
  ads_data JSONB DEFAULT '[]',

  -- AI Analysis Results (structured like the PDF example)
  overview TEXT,
  positioning TEXT,

  -- Creative strategy analysis
  creative_strategy JSONB DEFAULT '{}',

  -- Messaging analysis
  messaging_analysis JSONB DEFAULT '{}',

  -- Visual & design elements
  visual_design_elements JSONB DEFAULT '{}',

  -- Target audience insights
  target_audience_insights JSONB DEFAULT '{}',

  -- Performance indicators
  performance_indicators JSONB DEFAULT '{}',

  -- Actionable recommendations
  recommendations JSONB DEFAULT '[]',

  -- Key findings summary
  key_findings JSONB DEFAULT '[]',

  -- Metadata
  analysis_model VARCHAR(100),
  analysis_confidence DECIMAL(3,2),
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_brand_id ON competitor_analyses(brand_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_competitor_id ON competitor_analyses(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_competitor_name ON competitor_analyses(competitor_name);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_competitor_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_competitor_analyses_updated_at
  BEFORE UPDATE ON competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_analyses_updated_at();

-- Add comments for documentation
COMMENT ON TABLE competitor_analyses IS 'Comprehensive AI-powered competitor advertising analyses';
COMMENT ON COLUMN competitor_analyses.creative_strategy IS 'JSON object with ad creative patterns, formats, themes';
COMMENT ON COLUMN competitor_analyses.messaging_analysis IS 'JSON object with copy tone, key messages, CTAs, value props';
COMMENT ON COLUMN competitor_analyses.visual_design_elements IS 'JSON object with colors, imagery, typography, branding';
COMMENT ON COLUMN competitor_analyses.target_audience_insights IS 'JSON object with demographics, psychographics, pain points';
COMMENT ON COLUMN competitor_analyses.performance_indicators IS 'JSON object with engagement patterns, ad frequency, timing';
COMMENT ON COLUMN competitor_analyses.recommendations IS 'Array of actionable insights for improving own campaigns';
