-- Create table for Lavage and Repassage reservations
CREATE TABLE IF NOT EXISTS public.lavage_ropassage_reservations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    
    -- User information
    firstname TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    location TEXT,
    
    -- Service information
    service_type TEXT NOT NULL, -- 'lavage' or 'ropassage'
    type_menage_id BIGINT REFERENCES public.types_menage(id),
    menage_id BIGINT REFERENCES public.menage(id),
    item_name TEXT,
    item_description TEXT,
    item_price NUMERIC(10, 2),
    item_image TEXT,
    
    -- Selected options
    selected_options JSONB, -- Array of selected main options: ['vetements', 'grands_textiles']
    
    -- Vêtements details (if selected)
    vetements_details JSONB, -- { 'option1': { selected: true, quantity: 2 }, 'option2': { selected: true, quantity: 1 }, ... }
    
    -- Grands textiles details (if selected)
    grands_textiles_details JSONB, -- { count: 2, pieces: [{ length: 150, width: 200 }, { length: 180, width: 220 }] }
    
    -- Pricing
    final_price NUMERIC(10, 2) NOT NULL, -- Final calculated price
    
    -- Reservation details
    preferred_date DATE,
    message TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
    
    -- Additional notes
    notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.lavage_ropassage_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insert for lavage_ropassage_reservations
CREATE POLICY "Allow public insert for lavage_ropassage_reservations"
    ON public.lavage_ropassage_reservations
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow authenticated users to view their own reservations
CREATE POLICY "Allow authenticated users to view their lavage_ropassage_reservations"
    ON public.lavage_ropassage_reservations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own reservations
CREATE POLICY "Allow authenticated users to update their lavage_ropassage_reservations"
    ON public.lavage_ropassage_reservations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Allow public read for lavage_ropassage_reservations
CREATE POLICY "Allow public read for lavage_ropassage_reservations"
    ON public.lavage_ropassage_reservations
    FOR SELECT
    USING (true);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lavage_ropassage_reservations_user_id ON public.lavage_ropassage_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_lavage_ropassage_reservations_service_type ON public.lavage_ropassage_reservations(service_type);
CREATE INDEX IF NOT EXISTS idx_lavage_ropassage_reservations_status ON public.lavage_ropassage_reservations(status);
CREATE INDEX IF NOT EXISTS idx_lavage_ropassage_reservations_created_at ON public.lavage_ropassage_reservations(created_at DESC);

-- Add comments
COMMENT ON TABLE public.lavage_ropassage_reservations IS 'Stores reservations for Lavage and Repassage services.';
COMMENT ON COLUMN public.lavage_ropassage_reservations.service_type IS 'Type of service: "lavage" for washing, "ropassage" for ironing.';
COMMENT ON COLUMN public.lavage_ropassage_reservations.selected_options IS 'Array of selected main options: ["vetements", "grands_textiles"].';
COMMENT ON COLUMN public.lavage_ropassage_reservations.vetements_details IS 'JSON object with vêtements sub-options and quantities: {"option1": {"selected": true, "quantity": 2}, ...}.';
COMMENT ON COLUMN public.lavage_ropassage_reservations.grands_textiles_details IS 'JSON object with grands textiles details: {"count": 2, "pieces": [{"length": 150, "width": 200}, ...]}.';
COMMENT ON COLUMN public.lavage_ropassage_reservations.final_price IS 'Final calculated price based on selected options and quantities/dimensions.';

