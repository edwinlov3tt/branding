-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500),
    logo_url TEXT,
    primary_color VARCHAR(7),
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_id VARCHAR(6) UNIQUE NOT NULL,
    industry VARCHAR(100),
    favicon_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create brand_data table (stores extracted brand information)
CREATE TABLE IF NOT EXISTS brand_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE,
    colors JSONB,
    typography JSONB,
    logos JSONB,
    metadata JSONB,
    screenshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create target_audiences table
CREATE TABLE IF NOT EXISTS target_audiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    demographics TEXT,
    interests JSONB,
    pain_points JSONB,
    goals JSONB,
    budget_range VARCHAR(100),
    channels JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products_services table
CREATE TABLE IF NOT EXISTS products_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    category VARCHAR(100),
    price VARCHAR(100),
    features JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    marketing_objective VARCHAR(50),
    launch_date DATE,
    budget VARCHAR(100),
    objective TEXT,
    target_audience TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create competitors table
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500),
    description TEXT,
    strengths JSONB,
    weaknesses JSONB,
    market_position VARCHAR(100),
    pricing VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    thumbnail TEXT,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create generations table
CREATE TABLE IF NOT EXISTS generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    prompt TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    result TEXT,
    template VARCHAR(255),
    model VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_short_id ON brands(short_id);
CREATE INDEX IF NOT EXISTS idx_brand_data_brand_id ON brand_data(brand_id);
CREATE INDEX IF NOT EXISTS idx_target_audiences_brand_id ON target_audiences(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_services_brand_id ON products_services(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_competitors_brand_id ON competitors(brand_id);
CREATE INDEX IF NOT EXISTS idx_templates_brand_id ON templates(brand_id);
CREATE INDEX IF NOT EXISTS idx_generations_brand_id ON generations(brand_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_target_audiences_updated_at BEFORE UPDATE ON target_audiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_services_updated_at BEFORE UPDATE ON products_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
