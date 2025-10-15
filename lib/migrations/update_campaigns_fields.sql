-- Add product_service_id field
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS product_service_id UUID REFERENCES products_services(id) ON DELETE SET NULL;

-- Add marketing_objectives field (JSONB array)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS marketing_objectives JSONB DEFAULT '[]';

-- Add other_objective field for custom objective text
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS other_objective TEXT;

-- Drop budget column
ALTER TABLE campaigns
DROP COLUMN IF EXISTS budget;

-- Add index for product_service lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_product_service_id
ON campaigns(product_service_id);
