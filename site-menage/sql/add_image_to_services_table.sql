-- Add image column to services table for housekeeping services
-- This allows storing image URLs for services

-- Add image column if it doesn't exist
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS image TEXT;

-- Add comment for documentation
COMMENT ON COLUMN services.image IS 'URL of the service image stored in Supabase Storage';

-- Create index for faster queries (optional, but recommended if you'll filter by image)
CREATE INDEX IF NOT EXISTS idx_services_image ON services(image) WHERE image IS NOT NULL;

