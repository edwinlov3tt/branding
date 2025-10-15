-- Migration: Add generated_creatives and ad_copy_variants tables
-- Description: Store AI-generated ad copy for campaigns
-- Created: 2025-10-10

-- Create generated_creatives table
CREATE TABLE IF NOT EXISTS generated_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  channel VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  generation_model VARCHAR(50),
  context_used JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ad_copy_variants table
CREATE TABLE IF NOT EXISTS ad_copy_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID NOT NULL REFERENCES generated_creatives(id) ON DELETE CASCADE,
  variant_number INT NOT NULL CHECK (variant_number BETWEEN 1 AND 5),
  copy_data JSONB NOT NULL,
  rationale TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_id, variant_number)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_generated_creatives_brand_id ON generated_creatives(brand_id);
CREATE INDEX IF NOT EXISTS idx_generated_creatives_campaign_id ON generated_creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_generated_creatives_status ON generated_creatives(status);
CREATE INDEX IF NOT EXISTS idx_ad_copy_variants_creative_id ON ad_copy_variants(creative_id);

-- Create brand_settings table for storing guidelines
CREATE TABLE IF NOT EXISTS brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  creative_guidelines TEXT,
  ad_copy_guidelines TEXT,
  brand_guidelines TEXT,
  emoji_usage VARCHAR(20) DEFAULT 'auto' CHECK (emoji_usage IN ('never', 'sparingly', 'auto', 'always')),
  tone_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(brand_id)
);

CREATE INDEX IF NOT EXISTS idx_brand_settings_brand_id ON brand_settings(brand_id);
