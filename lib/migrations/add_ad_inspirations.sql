-- Create ad_inspirations table for storing ad creative inspiration
CREATE TABLE IF NOT EXISTS ad_inspirations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    foreplay_ad_id VARCHAR(255),
    ad_data JSONB NOT NULL,
    thumbnail_url TEXT NOT NULL,
    video_url TEXT,
    platform VARCHAR(50) NOT NULL,
    advertiser_name VARCHAR(255) NOT NULL,
    niche VARCHAR(100),
    ad_copy TEXT,
    is_curated BOOLEAN DEFAULT false,
    saved_by_brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ad_inspirations_brand_id ON ad_inspirations(brand_id);
CREATE INDEX IF NOT EXISTS idx_ad_inspirations_platform ON ad_inspirations(platform);
CREATE INDEX IF NOT EXISTS idx_ad_inspirations_niche ON ad_inspirations(niche);
CREATE INDEX IF NOT EXISTS idx_ad_inspirations_is_curated ON ad_inspirations(is_curated);
CREATE INDEX IF NOT EXISTS idx_ad_inspirations_saved_by ON ad_inspirations(saved_by_brand_id);

-- Apply updated_at trigger
CREATE TRIGGER update_ad_inspirations_updated_at BEFORE UPDATE ON ad_inspirations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
