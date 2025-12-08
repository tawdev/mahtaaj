-- Create table for Airbnb reservations
CREATE TABLE IF NOT EXISTS public.airbnb_reservations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    
    -- User information
    firstname TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    location TEXT NOT NULL, -- Required location
    
    -- Service information
    service_type TEXT NOT NULL, -- 'nettoyage_rapide' or 'nettoyage_complet'
    type_menage_id BIGINT REFERENCES public.types_menage(id),
    menage_id BIGINT REFERENCES public.menage(id),
    item_name TEXT,
    item_description TEXT,
    item_price NUMERIC(10, 2), -- Base price per m²
    item_image TEXT,
    
    -- Dimensions and pricing (optional - for backward compatibility)
    length_cm NUMERIC(10, 2), -- Length in centimeters (optional)
    width_cm NUMERIC(10, 2), -- Width in centimeters (optional)
    total_area_m2 NUMERIC(10, 2), -- Total area in square meters (optional)
    final_price NUMERIC(10, 2) NOT NULL, -- Final price (required)
    
    -- Reservation details
    preferred_date DATE,
    message TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
    
    -- Additional notes
    notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.airbnb_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insert for airbnb_reservations
CREATE POLICY "Allow public insert for airbnb_reservations"
    ON public.airbnb_reservations
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow authenticated users to view their own reservations
CREATE POLICY "Allow authenticated users to view their airbnb_reservations"
    ON public.airbnb_reservations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own reservations
CREATE POLICY "Allow authenticated users to update their airbnb_reservations"
    ON public.airbnb_reservations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Allow public to read all reservations (for admin purposes)
CREATE POLICY "Allow public read for airbnb_reservations"
    ON public.airbnb_reservations
    FOR SELECT
    USING (true);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_airbnb_reservations_user_id ON public.airbnb_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_airbnb_reservations_service_type ON public.airbnb_reservations(service_type);
CREATE INDEX IF NOT EXISTS idx_airbnb_reservations_status ON public.airbnb_reservations(status);
CREATE INDEX IF NOT EXISTS idx_airbnb_reservations_created_at ON public.airbnb_reservations(created_at DESC);

-- Add comments
COMMENT ON TABLE public.airbnb_reservations IS 'Stores reservations for Airbnb cleaning services (rapide and complet).';
COMMENT ON COLUMN public.airbnb_reservations.service_type IS 'Type of service: "nettoyage_rapide" for quick cleaning, "nettoyage_complet" for complete cleaning.';
COMMENT ON COLUMN public.airbnb_reservations.length_cm IS 'Length of the area in centimeters (optional, for backward compatibility).';
COMMENT ON COLUMN public.airbnb_reservations.width_cm IS 'Width of the area in centimeters (optional, for backward compatibility).';
COMMENT ON COLUMN public.airbnb_reservations.total_area_m2 IS 'Total area in square meters (optional, for backward compatibility).';
COMMENT ON COLUMN public.airbnb_reservations.final_price IS 'Final price for the service (required).';
COMMENT ON COLUMN public.airbnb_reservations.location IS 'Location where the cleaning service should be performed (required).';

