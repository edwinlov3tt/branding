-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  objective TEXT NOT NULL,
  target_audience_ids JSONB DEFAULT '[]',
  start_date DATE,
  end_date DATE,
  budget VARCHAR(100),
  channels JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster brand lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id
ON campaigns(brand_id);

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_campaigns_status
ON campaigns(status);

-- Add updated_at trigger
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE
ON campaigns FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
