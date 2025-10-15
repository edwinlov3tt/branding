-- Add support for multiple images with default image selection
-- Migration: Update products_services table for multiple images

-- Add new columns for multiple images
ALTER TABLE products_services
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS default_image_url TEXT;

-- Migrate existing single image_url to new structure
UPDATE products_services
SET image_urls = ARRAY[image_url]::TEXT[],
    default_image_url = image_url
WHERE image_url IS NOT NULL AND image_url != '';

-- Remove old image_url column (optional - commented out for safety)
-- ALTER TABLE products_services DROP COLUMN IF EXISTS image_url;
