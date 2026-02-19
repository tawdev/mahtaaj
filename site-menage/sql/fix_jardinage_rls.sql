-- ==========================================
-- FIX RLS PERMISSIONS FOR JARDINAGE MODULE
-- Run this in your Supabase SQL Editor
-- ==========================================

BEGIN;

-- 1. Table: jardins (Services)
ALTER TABLE jardins ENABLE ROW LEVEL SECURITY;

-- Allow PUBLIC (anon) to read, insert, update and delete
-- (Note: Ideally this should be restricted to authenticated admins, 
-- but consistent with the current app's unauthenticated admin approach)
DROP POLICY IF EXISTS "Public Full Access jardins" ON jardins;
CREATE POLICY "Public Full Access jardins" ON jardins 
    FOR ALL 
    TO anon 
    USING (true) 
    WITH CHECK (true);

-- 2. Table: jardinage_reservations
ALTER TABLE jardinage_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Full Access jardinage_reservations" ON jardinage_reservations;
CREATE POLICY "Public Full Access jardinage_reservations" ON jardinage_reservations 
    FOR ALL 
    TO anon 
    USING (true) 
    WITH CHECK (true);

-- 3. Table: jardinage_categories
ALTER TABLE jardinage_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Full Access jardinage_categories" ON jardinage_categories;
CREATE POLICY "Public Full Access jardinage_categories" ON jardinage_categories 
    FOR ALL 
    TO anon 
    USING (true) 
    WITH CHECK (true);

COMMIT;
