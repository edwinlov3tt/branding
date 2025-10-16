-- Add description column to brands table
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS description TEXT;

-- Comment on column
COMMENT ON COLUMN brands.description IS 'Brief description of the brand';
