-- Migration: Add AI jobs queue table
-- Description: Track background AI processing jobs to avoid timeouts
-- Created: 2025-10-08

-- Create ai_jobs table for background processing
CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Job details
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN (
    'brand_intelligence',
    'target_audiences',
    'competitor_analysis',
    'products_services',
    'campaigns'
  )),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed'
  )),

  -- Input data
  input_data JSONB DEFAULT '{}',

  -- Output/results
  result_data JSONB DEFAULT '{}',
  result_id UUID,  -- ID of the created resource (e.g., competitor_analysis.id)

  -- Progress tracking
  progress INTEGER DEFAULT 0,  -- 0-100
  current_step TEXT,
  total_steps INTEGER DEFAULT 1,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_jobs_brand_id ON ai_jobs(brand_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_type ON ai_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_created_at ON ai_jobs(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_jobs_updated_at
  BEFORE UPDATE ON ai_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_jobs_updated_at();

-- Add comments
COMMENT ON TABLE ai_jobs IS 'Background job queue for long-running AI operations';
COMMENT ON COLUMN ai_jobs.job_type IS 'Type of AI job being processed';
COMMENT ON COLUMN ai_jobs.status IS 'Current status: pending, processing, completed, failed';
COMMENT ON COLUMN ai_jobs.progress IS 'Progress percentage (0-100)';
COMMENT ON COLUMN ai_jobs.result_id IS 'UUID of created resource (e.g., analysis ID)';
