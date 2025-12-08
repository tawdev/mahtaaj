-- Create table for voiture (car wash) reservations
CREATE TABLE IF NOT EXISTS public.voiture_reservations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    
    -- User information
    firstname TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL, -- Adresse (address)
    
    -- Service information
    service_type TEXT NOT NULL, -- 'centre' or 'domicile'
    type_menage_id BIGINT REFERENCES public.types_menage(id),
    menage_id BIGINT REFERENCES public.menage(id),
    item_name TEXT,
    item_description TEXT,
    item_price NUMERIC(10, 2),
    item_image TEXT,
    
    -- Reservation details
    preferred_date DATE,
    preferred_time TIME, -- Optional time preference
    message TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
    
    -- Additional notes
    notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.voiture_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insert for voiture_reservations
CREATE POLICY "Allow public insert for voiture_reservations"
    ON public.voiture_reservations
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow authenticated users to view their own reservations
CREATE POLICY "Allow authenticated users to view their voiture_reservations"
    ON public.voiture_reservations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own reservations
CREATE POLICY "Allow authenticated users to update their voiture_reservations"
    ON public.voiture_reservations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_voiture_reservations_user_id ON public.voiture_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_voiture_reservations_service_type ON public.voiture_reservations(service_type);
CREATE INDEX IF NOT EXISTS idx_voiture_reservations_status ON public.voiture_reservations(status);
CREATE INDEX IF NOT EXISTS idx_voiture_reservations_created_at ON public.voiture_reservations(created_at DESC);

-- Add comments
COMMENT ON TABLE public.voiture_reservations IS 'Stores reservations for car wash services (centre and domicile).';
COMMENT ON COLUMN public.voiture_reservations.service_type IS 'Type of service: "centre" for car wash center, "domicile" for at home service.';
COMMENT ON COLUMN public.voiture_reservations.address IS 'Address where the service should be performed (required for domicile, optional for centre).';
COMMENT ON COLUMN public.voiture_reservations.service_type IS 'Type of service: "centre" for car wash center, "domicile" for at home service.';

