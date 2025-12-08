-- Fix RLS policies for voiture_reservations table
-- Execute this script in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert for voiture_reservations" ON public.voiture_reservations;
DROP POLICY IF EXISTS "Allow authenticated users to view their voiture_reservations" ON public.voiture_reservations;
DROP POLICY IF EXISTS "Allow authenticated users to update their voiture_reservations" ON public.voiture_reservations;

-- Policy: Allow public insert for voiture_reservations (for unauthenticated users)
CREATE POLICY "Allow public insert for voiture_reservations"
    ON public.voiture_reservations
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow public read access for voiture_reservations (for admin purposes)
CREATE POLICY "Allow public read access for voiture_reservations"
    ON public.voiture_reservations
    FOR SELECT
    USING (true);

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

-- Verify RLS is enabled
ALTER TABLE public.voiture_reservations ENABLE ROW LEVEL SECURITY;

