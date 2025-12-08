-- Create table for Tapis and Canapes reservations
-- Execute this script in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.tapis_canapes_reservations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  -- User information
  firstname TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT,
  
  -- Service information
  service_type TEXT NOT NULL, -- 'tapis', 'canapes', or 'tapis_et_canapes'
  type_menage_id BIGINT REFERENCES public.types_menage(id) ON DELETE SET NULL,
  menage_id BIGINT REFERENCES public.menage(id) ON DELETE SET NULL,
  
  -- Item details
  item_name TEXT,
  item_description TEXT,
  item_price NUMERIC(10, 2),
  
  -- Dimensions and count
  item_count INTEGER DEFAULT 0, -- Number of items (carpets/canapes)
  dimensions JSONB, -- Array of {length, width} for each item
  total_area_m2 NUMERIC(10, 2), -- Total area in square meters
  
  -- Pricing
  base_price_per_m2 NUMERIC(10, 2), -- Price per m²
  final_price NUMERIC(10, 2) NOT NULL, -- Final calculated price
  
  -- Additional information
  message TEXT,
  preferred_date DATE,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  admin_notes TEXT,
  
  -- User ID (if authenticated)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tapis_canapes_reservations_service_type ON public.tapis_canapes_reservations(service_type);
CREATE INDEX IF NOT EXISTS idx_tapis_canapes_reservations_status ON public.tapis_canapes_reservations(status);
CREATE INDEX IF NOT EXISTS idx_tapis_canapes_reservations_created_at ON public.tapis_canapes_reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tapis_canapes_reservations_user_id ON public.tapis_canapes_reservations(user_id);

-- Enable RLS
ALTER TABLE public.tapis_canapes_reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for public insert and admin access
DROP POLICY IF EXISTS "Public insert access for tapis_canapes_reservations" ON public.tapis_canapes_reservations;
CREATE POLICY "Public insert access for tapis_canapes_reservations"
  ON public.tapis_canapes_reservations
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read access for tapis_canapes_reservations" ON public.tapis_canapes_reservations;
CREATE POLICY "Public read access for tapis_canapes_reservations"
  ON public.tapis_canapes_reservations
  FOR SELECT
  USING (true);

-- Add comments
COMMENT ON TABLE public.tapis_canapes_reservations IS 'Reservations for Tapis and Canapes services';
COMMENT ON COLUMN public.tapis_canapes_reservations.service_type IS 'Type of service: tapis, canapes, or tapis_et_canapes';
COMMENT ON COLUMN public.tapis_canapes_reservations.dimensions IS 'JSON array of dimensions: [{"length": 150, "width": 200}, ...]';
COMMENT ON COLUMN public.tapis_canapes_reservations.total_area_m2 IS 'Total area calculated from all dimensions';

