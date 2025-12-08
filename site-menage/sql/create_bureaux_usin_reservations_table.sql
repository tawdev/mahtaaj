-- Create table for bureaux and usine (office and factory) reservations
CREATE TABLE IF NOT EXISTS public.bureaux_usin_reservations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    
    -- User information
    firstname TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    location TEXT NOT NULL, -- Required location
    
    -- Service information
    service_type TEXT NOT NULL, -- 'bureaux' or 'usine'
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
ALTER TABLE public.bureaux_usin_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insert for bureaux_usin_reservations
CREATE POLICY "Allow public insert for bureaux_usin_reservations"
    ON public.bureaux_usin_reservations
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow authenticated users to view their own reservations
CREATE POLICY "Allow authenticated users to view their bureaux_usin_reservations"
    ON public.bureaux_usin_reservations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own reservations
CREATE POLICY "Allow authenticated users to update their bureaux_usin_reservations"
    ON public.bureaux_usin_reservations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Allow public to read all reservations (for admin purposes)
CREATE POLICY "Allow public read for bureaux_usin_reservations"
    ON public.bureaux_usin_reservations
    FOR SELECT
    USING (true);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bureaux_usin_reservations_user_id ON public.bureaux_usin_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_bureaux_usin_reservations_service_type ON public.bureaux_usin_reservations(service_type);
CREATE INDEX IF NOT EXISTS idx_bureaux_usin_reservations_status ON public.bureaux_usin_reservations(status);
CREATE INDEX IF NOT EXISTS idx_bureaux_usin_reservations_created_at ON public.bureaux_usin_reservations(created_at DESC);

-- Add comments
COMMENT ON TABLE public.bureaux_usin_reservations IS 'Stores reservations for office (bureaux) and factory (usine) cleaning services.';
COMMENT ON COLUMN public.bureaux_usin_reservations.service_type IS 'Type of service: "bureaux" for office cleaning, "usine" for factory cleaning.';
COMMENT ON COLUMN public.bureaux_usin_reservations.length_cm IS 'Length of the area in centimeters.';
COMMENT ON COLUMN public.bureaux_usin_reservations.width_cm IS 'Width of the area in centimeters.';
COMMENT ON COLUMN public.bureaux_usin_reservations.total_area_m2 IS 'Total area in square meters calculated as (length_cm × width_cm) / 10000.';
COMMENT ON COLUMN public.bureaux_usin_reservations.final_price IS 'Total price calculated as item_price * total_area_m2.';
COMMENT ON COLUMN public.bureaux_usin_reservations.location IS 'Location where the cleaning service should be performed (required).';

