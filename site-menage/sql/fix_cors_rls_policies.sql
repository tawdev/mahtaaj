-- Fix CORS and RLS policies for all tables
-- This script ensures public read access for all tables
-- Execute this script in Supabase SQL Editor

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE IF EXISTS public.menage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.types_menage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.category_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reserve_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.securities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.security_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hand_worker_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hand_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hand_worker_reservations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for menage" ON public.menage;
DROP POLICY IF EXISTS "Public read access for types_menage" ON public.types_menage;
DROP POLICY IF EXISTS "Public read access for category_gallery" ON public.category_gallery;
DROP POLICY IF EXISTS "Public read access for gallery" ON public.gallery;
DROP POLICY IF EXISTS "Public read access for ratings" ON public.ratings;
DROP POLICY IF EXISTS "Public read access for services" ON public.services;
DROP POLICY IF EXISTS "Public read access for orders" ON public.orders;
DROP POLICY IF EXISTS "Public read access for reservations" ON public.reservations;
DROP POLICY IF EXISTS "Public read access for reserve_security" ON public.reserve_security;
DROP POLICY IF EXISTS "Public read access for securities" ON public.securities;
DROP POLICY IF EXISTS "Public read access for security_roles" ON public.security_roles;
DROP POLICY IF EXISTS "Public read access for hand_worker_categories" ON public.hand_worker_categories;
DROP POLICY IF EXISTS "Public read access for hand_workers" ON public.hand_workers;
DROP POLICY IF EXISTS "Public read access for hand_worker_reservations" ON public.hand_worker_reservations;

-- Create public read access policies for all tables
CREATE POLICY "Public read access for menage"
  ON public.menage
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for types_menage"
  ON public.types_menage
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for category_gallery"
  ON public.category_gallery
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for gallery"
  ON public.gallery
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for ratings"
  ON public.ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for services"
  ON public.services
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for orders"
  ON public.orders
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for reservations"
  ON public.reservations
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for reserve_security"
  ON public.reserve_security
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for securities"
  ON public.securities
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for security_roles"
  ON public.security_roles
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for hand_worker_categories"
  ON public.hand_worker_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for hand_workers"
  ON public.hand_workers
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access for hand_worker_reservations"
  ON public.hand_worker_reservations
  FOR SELECT
  USING (true);

-- Add comments
COMMENT ON POLICY "Public read access for menage" ON public.menage IS 'Allows public read access to menage table';
COMMENT ON POLICY "Public read access for types_menage" ON public.types_menage IS 'Allows public read access to types_menage table';
COMMENT ON POLICY "Public read access for category_gallery" ON public.category_gallery IS 'Allows public read access to category_gallery table';
COMMENT ON POLICY "Public read access for gallery" ON public.gallery IS 'Allows public read access to gallery table';
COMMENT ON POLICY "Public read access for ratings" ON public.ratings IS 'Allows public read access to ratings table';
COMMENT ON POLICY "Public read access for services" ON public.services IS 'Allows public read access to services table';
COMMENT ON POLICY "Public read access for orders" ON public.orders IS 'Allows public read access to orders table';
COMMENT ON POLICY "Public read access for reservations" ON public.reservations IS 'Allows public read access to reservations table';
COMMENT ON POLICY "Public read access for reserve_security" ON public.reserve_security IS 'Allows public read access to reserve_security table';
COMMENT ON POLICY "Public read access for securities" ON public.securities IS 'Allows public read access to securities table';
COMMENT ON POLICY "Public read access for security_roles" ON public.security_roles IS 'Allows public read access to security_roles table';
COMMENT ON POLICY "Public read access for hand_worker_categories" ON public.hand_worker_categories IS 'Allows public read access to hand_worker_categories table';
COMMENT ON POLICY "Public read access for hand_workers" ON public.hand_workers IS 'Allows public read access to hand_workers table';
COMMENT ON POLICY "Public read access for hand_worker_reservations" ON public.hand_worker_reservations IS 'Allows public read access to hand_worker_reservations table';

