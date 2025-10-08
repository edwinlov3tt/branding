-- Create target_audiences table
CREATE TABLE IF NOT EXISTS target_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  demographics JSONB DEFAULT '{}',
  psychographics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster brand lookups
CREATE INDEX IF NOT EXISTS idx_target_audiences_brand_id
ON target_audiences(brand_id);

-- Add updated_at trigger
CREATE TRIGGER update_target_audiences_updated_at BEFORE UPDATE
ON target_audiences FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
