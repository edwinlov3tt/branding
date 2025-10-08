-- Add search_query column to track what query found this ad
ALTER TABLE ad_inspirations 
ADD COLUMN IF NOT EXISTS search_query TEXT;

-- Add index for faster searches
CREATE INDEX IF NOT EXISTS idx_ad_inspirations_search_query 
ON ad_inspirations(search_query);
