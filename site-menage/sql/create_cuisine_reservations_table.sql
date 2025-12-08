-- Create table for Cuisine reservations
-- Execute this script in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.cuisine_reservations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  -- User information
  firstname TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  
  -- Service and category information
  category_house_id BIGINT REFERENCES public.categories_house(id) ON DELETE SET NULL,
  service_id BIGINT REFERENCES public.services(id) ON DELETE SET NULL,
  
  -- Selected types (stored as JSONB array)
  selected_types JSONB DEFAULT '[]'::jsonb, -- Array of {id, name, price}
  types_names TEXT, -- Names of selected types joined with ' + '
  
  -- Pricing
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  
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
CREATE INDEX IF NOT EXISTS idx_cuisine_reservations_category_house_id ON public.cuisine_reservations(category_house_id);
CREATE INDEX IF NOT EXISTS idx_cuisine_reservations_service_id ON public.cuisine_reservations(service_id);
CREATE INDEX IF NOT EXISTS idx_cuisine_reservations_status ON public.cuisine_reservations(status);
CREATE INDEX IF NOT EXISTS idx_cuisine_reservations_created_at ON public.cuisine_reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cuisine_reservations_user_id ON public.cuisine_reservations(user_id);

-- Enable RLS
ALTER TABLE public.cuisine_reservations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first (to avoid conflicts)
DO $$ 
DECLARE
    pol_name TEXT;
BEGIN
    -- Drop all existing policies by iterating through them
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'cuisine_reservations' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.cuisine_reservations', pol_name);
    END LOOP;
END $$;

-- Policy: Allow public insert
CREATE POLICY "cuisine_public_insert"
    ON public.cuisine_reservations
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy: Allow public select (needed for .select() after .insert())
CREATE POLICY "cuisine_public_select"
    ON public.cuisine_reservations
    FOR SELECT
    TO public
    USING (true);

-- Policy: Allow authenticated users to view their own reservations
CREATE POLICY "cuisine_auth_select"
    ON public.cuisine_reservations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own reservations
CREATE POLICY "cuisine_auth_update"
    ON public.cuisine_reservations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cuisine_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_cuisine_reservations_updated_at ON public.cuisine_reservations;

CREATE TRIGGER update_cuisine_reservations_updated_at
  BEFORE UPDATE ON public.cuisine_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_cuisine_reservations_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.cuisine_reservations IS 'Stores reservations for Cuisine services with selected types.';
COMMENT ON COLUMN public.cuisine_reservations.selected_types IS 'JSONB array containing selected cuisine types: [{id, name, price}, ...]';
COMMENT ON COLUMN public.cuisine_reservations.types_names IS 'Names of selected types joined with " + " for display purposes.';
COMMENT ON COLUMN public.cuisine_reservations.total_price IS 'Total price calculated from all selected types.';
COMMENT ON COLUMN public.cuisine_reservations.status IS 'Reservation status: pending, confirmed, cancelled, or completed.';

