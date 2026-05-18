-- ============================================================
-- SQL Migration: Fix RLS Policies for All Employee Tables
-- ============================================================
-- 💡 RUN THIS SCRIPT IN YOUR SUPABASE DASHBOARD -> SQL EDITOR
-- ============================================================

-- 1. Enable RLS on all employee tables (safe if already enabled)
ALTER TABLE IF EXISTS public.bebe_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.security_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jardinage_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.driver_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hand_worker_employees ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Allow anon select own bebe_employees" ON public.bebe_employees;
DROP POLICY IF EXISTS "Allow anon insert bebe_employees" ON public.bebe_employees;
DROP POLICY IF EXISTS "Allow public select on bebe_employees" ON public.bebe_employees;
DROP POLICY IF EXISTS "Allow public insert on bebe_employees" ON public.bebe_employees;
DROP POLICY IF EXISTS "Allow public update on bebe_employees" ON public.bebe_employees;
DROP POLICY IF EXISTS "Allow public delete on bebe_employees" ON public.bebe_employees;
DROP POLICY IF EXISTS "Allow public access on bebe_employees" ON public.bebe_employees;
DROP POLICY IF EXISTS "Allow select for all on bebe_employees" ON public.bebe_employees;
DROP POLICY IF EXISTS "Allow insert for all on bebe_employees" ON public.bebe_employees;
DROP POLICY IF EXISTS "Allow update for authenticated on bebe_employees" ON public.bebe_employees;
DROP POLICY IF EXISTS "Allow delete for authenticated on bebe_employees" ON public.bebe_employees;

DROP POLICY IF EXISTS "Allow anon select own security_employees" ON public.security_employees;
DROP POLICY IF EXISTS "Allow anon insert security_employees" ON public.security_employees;
DROP POLICY IF EXISTS "Allow public access on security_employees" ON public.security_employees;
DROP POLICY IF EXISTS "Allow select for all on security_employees" ON public.security_employees;
DROP POLICY IF EXISTS "Allow insert for all on security_employees" ON public.security_employees;
DROP POLICY IF EXISTS "Allow update for authenticated on security_employees" ON public.security_employees;
DROP POLICY IF EXISTS "Allow delete for authenticated on security_employees" ON public.security_employees;

DROP POLICY IF EXISTS "Allow anon select own jardinage_employees" ON public.jardinage_employees;
DROP POLICY IF EXISTS "Allow anon insert jardinage_employees" ON public.jardinage_employees;
DROP POLICY IF EXISTS "Allow public access on jardinage_employees" ON public.jardinage_employees;
DROP POLICY IF EXISTS "Allow select for all on jardinage_employees" ON public.jardinage_employees;
DROP POLICY IF EXISTS "Allow insert for all on jardinage_employees" ON public.jardinage_employees;
DROP POLICY IF EXISTS "Allow update for authenticated on jardinage_employees" ON public.jardinage_employees;
DROP POLICY IF EXISTS "Allow delete for authenticated on jardinage_employees" ON public.jardinage_employees;

DROP POLICY IF EXISTS "Allow anon select own driver_employees" ON public.driver_employees;
DROP POLICY IF EXISTS "Allow anon insert driver_employees" ON public.driver_employees;
DROP POLICY IF EXISTS "Allow public access on driver_employees" ON public.driver_employees;
DROP POLICY IF EXISTS "Allow select for all on driver_employees" ON public.driver_employees;
DROP POLICY IF EXISTS "Allow insert for all on driver_employees" ON public.driver_employees;
DROP POLICY IF EXISTS "Allow update for authenticated on driver_employees" ON public.driver_employees;
DROP POLICY IF EXISTS "Allow delete for authenticated on driver_employees" ON public.driver_employees;

DROP POLICY IF EXISTS "Allow anon select own hand_worker_employees" ON public.hand_worker_employees;
DROP POLICY IF EXISTS "Allow anon insert hand_worker_employees" ON public.hand_worker_employees;
DROP POLICY IF EXISTS "Allow public access on hand_worker_employees" ON public.hand_worker_employees;
DROP POLICY IF EXISTS "Allow select for all on hand_worker_employees" ON public.hand_worker_employees;
DROP POLICY IF EXISTS "Allow insert for all on hand_worker_employees" ON public.hand_worker_employees;
DROP POLICY IF EXISTS "Allow update for authenticated on hand_worker_employees" ON public.hand_worker_employees;
DROP POLICY IF EXISTS "Allow delete for authenticated on hand_worker_employees" ON public.hand_worker_employees;

-- 3. Create professional, robust, and secure RLS policies

-- ============================================================
-- Table: bebe_employees
-- ============================================================
-- Allow anyone (visitors & logged-in admins) to view employee data
CREATE POLICY "Allow select for all on bebe_employees" ON public.bebe_employees FOR SELECT USING (true);
-- Allow anyone to register as an employee
CREATE POLICY "Allow insert for all on bebe_employees" ON public.bebe_employees FOR INSERT WITH CHECK (true);
-- Only logged-in admin/authenticated users can toggle active status, validate, or update employee records
CREATE POLICY "Allow update for authenticated on bebe_employees" ON public.bebe_employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- Only logged-in admin/authenticated users can delete employee records
CREATE POLICY "Allow delete for authenticated on bebe_employees" ON public.bebe_employees FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Table: security_employees
-- ============================================================
CREATE POLICY "Allow select for all on security_employees" ON public.security_employees FOR SELECT USING (true);
CREATE POLICY "Allow insert for all on security_employees" ON public.security_employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated on security_employees" ON public.security_employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for authenticated on security_employees" ON public.security_employees FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Table: jardinage_employees
-- ============================================================
CREATE POLICY "Allow select for all on jardinage_employees" ON public.jardinage_employees FOR SELECT USING (true);
CREATE POLICY "Allow insert for all on jardinage_employees" ON public.jardinage_employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated on jardinage_employees" ON public.jardinage_employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for authenticated on jardinage_employees" ON public.jardinage_employees FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Table: driver_employees
-- ============================================================
CREATE POLICY "Allow select for all on driver_employees" ON public.driver_employees FOR SELECT USING (true);
CREATE POLICY "Allow insert for all on driver_employees" ON public.driver_employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated on driver_employees" ON public.driver_employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for authenticated on driver_employees" ON public.driver_employees FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Table: hand_worker_employees
-- ============================================================
CREATE POLICY "Allow select for all on hand_worker_employees" ON public.hand_worker_employees FOR SELECT USING (true);
CREATE POLICY "Allow insert for all on hand_worker_employees" ON public.hand_worker_employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated on hand_worker_employees" ON public.hand_worker_employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for authenticated on hand_worker_employees" ON public.hand_worker_employees FOR DELETE TO authenticated USING (true);

-- 4. Reload PostgREST schema cache to apply changes immediately
NOTIFY pgrst, 'reload schema';
