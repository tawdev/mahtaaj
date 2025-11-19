-- ============================================
-- Fix RLS policies for categories_house table
-- ============================================
-- Execute this script in Supabase SQL Editor to allow admin operations
-- ============================================

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'categories_house';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'categories_house';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all selects on categories_house" ON categories_house;
DROP POLICY IF EXISTS "Allow all inserts on categories_house" ON categories_house;
DROP POLICY IF EXISTS "Allow all updates on categories_house" ON categories_house;
DROP POLICY IF EXISTS "Allow all deletes on categories_house" ON categories_house;
DROP POLICY IF EXISTS "Anyone can view categories_house" ON categories_house;
DROP POLICY IF EXISTS "Anyone can manage categories_house" ON categories_house;

-- Create permissive policy for SELECT (allow everyone to read)
CREATE POLICY "Allow all selects on categories_house"
  ON categories_house
  FOR SELECT
  USING (true);

-- Create permissive policy for INSERT (allow admin to create)
-- NOTE: This allows anyone with anon key to insert. 
-- For production, you should add proper auth checks.
CREATE POLICY "Allow all inserts on categories_house"
  ON categories_house
  FOR INSERT
  WITH CHECK (true);

-- Create permissive policy for UPDATE (allow admin to modify)
CREATE POLICY "Allow all updates on categories_house"
  ON categories_house
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create permissive policy for DELETE (allow admin to delete)
CREATE POLICY "Allow all deletes on categories_house"
  ON categories_house
  FOR DELETE
  USING (true);

-- Verify that policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'categories_house';

-- Ensure RLS is enabled
ALTER TABLE categories_house ENABLE ROW LEVEL SECURITY;

