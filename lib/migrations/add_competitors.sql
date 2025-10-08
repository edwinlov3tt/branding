-- Create competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  website_url TEXT,
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  market_position VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster brand lookups
CREATE INDEX IF NOT EXISTS idx_competitors_brand_id
ON competitors(brand_id);

-- Add updated_at trigger
CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE
ON competitors FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
