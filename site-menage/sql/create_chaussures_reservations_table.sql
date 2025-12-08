-- Create table for chaussures (shoes) reservations
CREATE TABLE IF NOT EXISTS public.chaussures_reservations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    
    -- User information
    firstname TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    location TEXT, -- Optional location
    
    -- Service information
    service_type TEXT NOT NULL, -- 'cirage_chaussures' or 'nettoyage_chaussures'
    type_menage_id BIGINT REFERENCES public.types_menage(id),
    menage_id BIGINT REFERENCES public.menage(id),
    item_name TEXT,
    item_description TEXT,
    item_price NUMERIC(10, 2), -- Base price per pair
    item_image TEXT,
    
    -- Shoe count and pricing
    shoe_count INT NOT NULL DEFAULT 1, -- Number of pairs of shoes
    final_price NUMERIC(10, 2) NOT NULL, -- Total price = item_price * shoe_count
    
    -- Reservation details
    preferred_date DATE,
    message TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
    
    -- Additional notes
    notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.chaussures_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insert for chaussures_reservations
CREATE POLICY "Allow public insert for chaussures_reservations"
    ON public.chaussures_reservations
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow authenticated users to view their own reservations
CREATE POLICY "Allow authenticated users to view their chaussures_reservations"
    ON public.chaussures_reservations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own reservations
CREATE POLICY "Allow authenticated users to update their chaussures_reservations"
    ON public.chaussures_reservations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Allow public to read all reservations (for admin purposes)
CREATE POLICY "Allow public read for chaussures_reservations"
    ON public.chaussures_reservations
    FOR SELECT
    USING (true);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chaussures_reservations_user_id ON public.chaussures_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_chaussures_reservations_service_type ON public.chaussures_reservations(service_type);
CREATE INDEX IF NOT EXISTS idx_chaussures_reservations_status ON public.chaussures_reservations(status);
CREATE INDEX IF NOT EXISTS idx_chaussures_reservations_created_at ON public.chaussures_reservations(created_at DESC);

-- Add comments
COMMENT ON TABLE public.chaussures_reservations IS 'Stores reservations for shoe services (cirage and nettoyage).';
COMMENT ON COLUMN public.chaussures_reservations.service_type IS 'Type of service: "cirage_chaussures" for shoe polishing, "nettoyage_chaussures" for shoe cleaning.';
COMMENT ON COLUMN public.chaussures_reservations.shoe_count IS 'Number of pairs of shoes.';
COMMENT ON COLUMN public.chaussures_reservations.final_price IS 'Total price calculated as item_price * shoe_count.';

