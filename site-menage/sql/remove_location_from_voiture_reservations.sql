-- Remove location column from voiture_reservations table
-- Execute this script in Supabase SQL Editor

-- Drop the location column if it exists
ALTER TABLE IF EXISTS public.voiture_reservations 
DROP COLUMN IF EXISTS location;

-- Add comment
COMMENT ON TABLE public.voiture_reservations IS 'Stores reservations for car wash services (centre and domicile). Location field has been removed.';

