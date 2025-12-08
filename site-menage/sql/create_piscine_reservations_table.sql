-- Create table for piscine (pool) reservations
CREATE TABLE IF NOT EXISTS public.piscine_reservations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    
    -- User information
    firstname TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    location TEXT NOT NULL, -- Required location
    
    -- Service information
    service_type TEXT NOT NULL, -- 'nettoyage_profond' or 'nettoyage_standard'
    type_menage_id BIGINT REFERENCES public.types_menage(id),
    menage_id BIGINT REFERENCES public.menage(id),
    item_name TEXT,
    item_description TEXT,
    item_price NUMERIC(10, 2), -- Base price per m²
    item_image TEXT,
    
    -- Dimensions and pricing
    length_cm NUMERIC(10, 2), -- Length in centimeters
    width_cm NUMERIC(10, 2), -- Width in centimeters
    total_area_m2 NUMERIC(10, 2), -- Total area in square meters = (length × width) / 10000
    final_price NUMERIC(10, 2) NOT NULL, -- Total price = item_price * total_area_m2
    
    -- Reservation details
    preferred_date DATE,
    message TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
    
    -- Additional notes
    notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.piscine_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insert for piscine_reservations
CREATE POLICY "Allow public insert for piscine_reservations"
    ON public.piscine_reservations
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow authenticated users to view their own reservations
CREATE POLICY "Allow authenticated users to view their piscine_reservations"
    ON public.piscine_reservations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own reservations
CREATE POLICY "Allow authenticated users to update their piscine_reservations"
    ON public.piscine_reservations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Allow public to read all reservations (for admin purposes)
CREATE POLICY "Allow public read for piscine_reservations"
    ON public.piscine_reservations
    FOR SELECT
    USING (true);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_piscine_reservations_user_id ON public.piscine_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_piscine_reservations_service_type ON public.piscine_reservations(service_type);
CREATE INDEX IF NOT EXISTS idx_piscine_reservations_status ON public.piscine_reservations(status);
CREATE INDEX IF NOT EXISTS idx_piscine_reservations_created_at ON public.piscine_reservations(created_at DESC);

-- Add comments
COMMENT ON TABLE public.piscine_reservations IS 'Stores reservations for pool cleaning services (nettoyage profond and standard).';
COMMENT ON COLUMN public.piscine_reservations.service_type IS 'Type of service: "nettoyage_profond" for deep cleaning, "nettoyage_standard" for standard cleaning.';
COMMENT ON COLUMN public.piscine_reservations.length_cm IS 'Length of the pool in centimeters.';
COMMENT ON COLUMN public.piscine_reservations.width_cm IS 'Width of the pool in centimeters.';
COMMENT ON COLUMN public.piscine_reservations.total_area_m2 IS 'Total area in square meters calculated as (length_cm × width_cm) / 10000.';
COMMENT ON COLUMN public.piscine_reservations.final_price IS 'Total price calculated as item_price * total_area_m2.';
COMMENT ON COLUMN public.piscine_reservations.location IS 'Location where the pool cleaning service should be performed (required).';

