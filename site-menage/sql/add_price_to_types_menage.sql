-- Add price column to types_menage table
-- This script adds a price field to store the price for each type of menage service

-- Add the price column (DECIMAL for precise currency values)
ALTER TABLE public.types_menage
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);

-- Add a comment to document the column
COMMENT ON COLUMN public.types_menage.price IS 'Price in the default currency (e.g., MAD/DH) for this type of menage service';

-- Optional: Create an index on price if you plan to filter/sort by price frequently
-- CREATE INDEX IF NOT EXISTS idx_types_menage_price ON public.types_menage(price);

-- Optional: Set a default value (e.g., 0.00) for existing rows
-- UPDATE public.types_menage SET price = 0.00 WHERE price IS NULL;

