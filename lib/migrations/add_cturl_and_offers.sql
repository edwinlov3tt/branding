-- Add CTURL field to products_services table
ALTER TABLE products_services
ADD COLUMN IF NOT EXISTS cturl TEXT;

-- Create product_offers table
CREATE TABLE IF NOT EXISTS product_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_service_id UUID NOT NULL REFERENCES products_services(id) ON DELETE CASCADE,
  offer_text TEXT NOT NULL,
  expiration_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster product lookups
CREATE INDEX IF NOT EXISTS idx_product_offers_product_service_id
ON product_offers(product_service_id);

-- Add index for filtering by expiration date
CREATE INDEX IF NOT EXISTS idx_product_offers_expiration_date
ON product_offers(expiration_date);
