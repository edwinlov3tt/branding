-- Fix campaigns table schema to match application code
-- This migration aligns the database schema with what the frontend/backend expects

-- Drop old columns that don't match the code
ALTER TABLE campaigns
DROP COLUMN IF EXISTS target_audience CASCADE;

ALTER TABLE campaigns
DROP COLUMN IF EXISTS launch_date CASCADE;

ALTER TABLE campaigns
DROP COLUMN IF EXISTS marketing_objective CASCADE;

-- Add new columns that the code expects
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS target_audience_ids JSONB DEFAULT '[]';

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS channels JSONB DEFAULT '[]';

-- Update status column to allow longer values
ALTER TABLE campaigns
ALTER COLUMN status TYPE VARCHAR(50);

-- Comment for documentation
COMMENT ON COLUMN campaigns.target_audience_ids IS 'Array of target audience UUIDs';
COMMENT ON COLUMN campaigns.channels IS 'Array of channel names (e.g., Meta, Display)';
COMMENT ON COLUMN campaigns.start_date IS 'Campaign start date';
COMMENT ON COLUMN campaigns.end_date IS 'Campaign end date';
