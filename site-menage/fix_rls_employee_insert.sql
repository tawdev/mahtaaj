-- ============================================================
-- FIX: RLS Policy Violations on Employee Registration Tables
-- Run this in Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Enable RLS on all affected tables (safe if already enabled)
ALTER TABLE bebe_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE jardinage_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hand_worker_employees ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. bebe_employees
-- ============================================================
DROP POLICY IF EXISTS "Allow anon insert bebe_employees" ON bebe_employees;
CREATE POLICY "Allow anon insert bebe_employees"
  ON bebe_employees
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select own bebe_employees" ON bebe_employees;
CREATE POLICY "Allow anon select own bebe_employees"
  ON bebe_employees
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- 3. security_employees
-- ============================================================
DROP POLICY IF EXISTS "Allow anon insert security_employees" ON security_employees;
CREATE POLICY "Allow anon insert security_employees"
  ON security_employees
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select own security_employees" ON security_employees;
CREATE POLICY "Allow anon select own security_employees"
  ON security_employees
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- 4. jardinage_employees
-- ============================================================
DROP POLICY IF EXISTS "Allow anon insert jardinage_employees" ON jardinage_employees;
CREATE POLICY "Allow anon insert jardinage_employees"
  ON jardinage_employees
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select own jardinage_employees" ON jardinage_employees;
CREATE POLICY "Allow anon select own jardinage_employees"
  ON jardinage_employees
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- 5. hand_worker_employees
-- ============================================================
DROP POLICY IF EXISTS "Allow anon insert hand_worker_employees" ON hand_worker_employees;
CREATE POLICY "Allow anon insert hand_worker_employees"
  ON hand_worker_employees
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select own hand_worker_employees" ON hand_worker_employees;
CREATE POLICY "Allow anon select own hand_worker_employees"
  ON hand_worker_employees
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- Verification: list policies for these tables
-- ============================================================
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('bebe_employees', 'security_employees', 'jardinage_employees', 'hand_worker_employees')
ORDER BY tablename, cmd;
