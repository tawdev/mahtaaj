-- Create table for Ménage Complet reservations
-- Execute this script in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.menage_complet_reservations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  -- User information
  firstname TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  
  -- Service information
  service_type TEXT NOT NULL, -- 'resort_hotel', 'maison', 'appartement', 'hotel', 'maison_dhote', 'villa'
  type_menage_id BIGINT REFERENCES public.types_menage(id) ON DELETE SET NULL,
  menage_id BIGINT REFERENCES public.menage(id) ON DELETE SET NULL,
  
  -- Item details
  item_name TEXT,
  item_description TEXT,
  item_price NUMERIC(10, 2),
  item_image TEXT,
  
  -- Reservation details (stored as JSONB for flexibility)
  reservation_data JSONB DEFAULT '{}'::jsonb, -- Contains all form data: rooms, bathrooms, salons, etc.
  final_price NUMERIC(10, 2) NOT NULL, -- Final calculated price
  
  -- Additional information
  message TEXT,
  preferred_date DATE,
  preferred_time TIME,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  admin_notes TEXT,
  
  -- User ID (if authenticated)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_menage_complet_reservations_service_type ON public.menage_complet_reservations(service_type);
CREATE INDEX IF NOT EXISTS idx_menage_complet_reservations_status ON public.menage_complet_reservations(status);
CREATE INDEX IF NOT EXISTS idx_menage_complet_reservations_created_at ON public.menage_complet_reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menage_complet_reservations_user_id ON public.menage_complet_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_menage_complet_reservations_type_menage_id ON public.menage_complet_reservations(type_menage_id);

-- Enable RLS
ALTER TABLE public.menage_complet_reservations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first (to avoid conflicts)
-- Using a DO block to handle all policy drops safely
DO $$ 
DECLARE
    pol_name TEXT;
BEGIN
    -- Drop all existing policies by iterating through them
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'menage_complet_reservations' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.menage_complet_reservations', pol_name);
    END LOOP;
END $$;

-- Policy: Allow public insert (using shorter name to avoid truncation)
CREATE POLICY "menage_complet_public_insert"
    ON public.menage_complet_reservations
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy: Allow public select (needed for .select() after .insert())
CREATE POLICY "menage_complet_public_select"
    ON public.menage_complet_reservations
    FOR SELECT
    TO public
    USING (true);

-- Policy: Allow authenticated users to view their own reservations
CREATE POLICY "menage_complet_auth_select"
    ON public.menage_complet_reservations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own reservations
CREATE POLICY "menage_complet_auth_update"
    ON public.menage_complet_reservations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_menage_complet_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_menage_complet_reservations_updated_at ON public.menage_complet_reservations;

CREATE TRIGGER update_menage_complet_reservations_updated_at
  BEFORE UPDATE ON public.menage_complet_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_menage_complet_reservations_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.menage_complet_reservations IS 'Stores reservations for Ménage Complet services (Resort Hotel, Maison, Appartement, Hotel, Maison d''hôte, Villa).';
COMMENT ON COLUMN public.menage_complet_reservations.service_type IS 'Type of service: "resort_hotel", "maison", "appartement", "hotel", "maison_dhote", or "villa".';
COMMENT ON COLUMN public.menage_complet_reservations.reservation_data IS 'JSONB object containing all form data: rooms, bathrooms, salons, garden, pool, etc. with their dimensions.';
COMMENT ON COLUMN public.menage_complet_reservations.final_price IS 'Final calculated price based on all areas and services selected.';

