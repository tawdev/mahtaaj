-- Update airbnb_reservations table to make dimension fields optional
-- This migration makes length_cm, width_cm, and total_area_m2 nullable
-- to support the new Pack-based pricing model

-- Make dimension fields nullable
ALTER TABLE public.airbnb_reservations 
    ALTER COLUMN length_cm DROP NOT NULL,
    ALTER COLUMN width_cm DROP NOT NULL,
    ALTER COLUMN total_area_m2 DROP NOT NULL;

-- Update comments
COMMENT ON COLUMN public.airbnb_reservations.length_cm IS 'Length of the area in centimeters (optional, for backward compatibility).';
COMMENT ON COLUMN public.airbnb_reservations.width_cm IS 'Width of the area in centimeters (optional, for backward compatibility).';
COMMENT ON COLUMN public.airbnb_reservations.total_area_m2 IS 'Total area in square meters (optional, for backward compatibility).';
COMMENT ON COLUMN public.airbnb_reservations.final_price IS 'Final price for the service (required).';

