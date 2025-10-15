-- Migration: Add brand_images table
-- Description: Store discovered brand images to prevent re-fetching on every page visit
-- Created: 2025-10-10

-- Create brand_images table to cache discovered pages and images
CREATE TABLE IF NOT EXISTS brand_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Page information
  page_url TEXT NOT NULL,
  page_title TEXT,
  page_category VARCHAR(100), -- home, about, services, product, blog, etc.
  relevance_score DECIMAL(3,2), -- 0.00 to 1.00

  -- Images from this page (stored as JSONB array)
  images JSONB DEFAULT '[]', -- Array of {url, alt, width, height, relevance}

  -- Metadata
  images_count INTEGER DEFAULT 0,
  last_fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one entry per brand+page combination
  UNIQUE(brand_id, page_url)
);

-- Create index on brand_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_images_brand_id ON brand_images(brand_id);

-- Create index on last_fetched_at for cache invalidation
CREATE INDEX IF NOT EXISTS idx_brand_images_last_fetched ON brand_images(last_fetched_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_brand_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brand_images_updated_at
  BEFORE UPDATE ON brand_images
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_images_updated_at();

-- Add comments for documentation
COMMENT ON TABLE brand_images IS 'Cached brand images discovered from website pages to prevent repeated API calls';
COMMENT ON COLUMN brand_images.images IS 'JSONB array of image objects with url, alt, width, height, relevance';
COMMENT ON COLUMN brand_images.relevance_score IS 'Page relevance score (0.00 to 1.00) from discovery API';
COMMENT ON COLUMN brand_images.last_fetched_at IS 'Timestamp of last fetch for cache invalidation (e.g., refresh after 7 days)';
