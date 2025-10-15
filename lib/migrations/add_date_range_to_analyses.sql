-- Migration: Add date range fields to competitor_analyses
-- Description: Track the date range used for each competitor analysis
-- Created: 2025-10-10

-- Add start_date and end_date columns
ALTER TABLE competitor_analyses
ADD COLUMN IF NOT EXISTS analysis_start_date DATE,
ADD COLUMN IF NOT EXISTS analysis_end_date DATE;

-- Add index for querying by date range
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_date_range
ON competitor_analyses(analysis_start_date, analysis_end_date);

-- Add comments for documentation
COMMENT ON COLUMN competitor_analyses.analysis_start_date IS 'Start date of the ad analysis period';
COMMENT ON COLUMN competitor_analyses.analysis_end_date IS 'End date of the ad analysis period';
