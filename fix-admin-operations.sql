-- ============================================
-- Fix Admin Operations - Combined Fix
-- ============================================
-- This script fixes:
-- 1. Services sequence issue (duplicate key error)
-- 2. RLS policies for services table
-- 3. RLS policies for categories_house table
-- ============================================
-- Execute this script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Fix Services Sequence
-- ============================================
SELECT
  setval(
    pg_get_serial_sequence('services', 'id'),
    COALESCE((SELECT MAX(id) + 1 FROM services), 1),
    false
  );

-- ============================================
-- 1bis. Fix Categories House Sequence
-- ============================================
SELECT
  setval(
    pg_get_serial_sequence('categories_house', 'id'),
    COALESCE((SELECT MAX(id) + 1 FROM categories_house), 1),
    false
  );

-- ============================================
-- 2. Fix Services RLS Policies
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all inserts on services" ON services;
DROP POLICY IF EXISTS "Allow all updates on services" ON services;
DROP POLICY IF EXISTS "Allow all deletes on services" ON services;

-- Create policies for services
CREATE POLICY "Allow all inserts on services"
ON services FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all updates on services"
ON services FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all deletes on services"
ON services FOR DELETE
USING (true);

-- ============================================
-- 3. Fix Categories House RLS Policies
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all selects on categories_house" ON categories_house;
DROP POLICY IF EXISTS "Allow all inserts on categories_house" ON categories_house;
DROP POLICY IF EXISTS "Allow all updates on categories_house" ON categories_house;
DROP POLICY IF EXISTS "Allow all deletes on categories_house" ON categories_house;

-- Create policies for categories_house
CREATE POLICY "Allow all selects on categories_house"
ON categories_house FOR SELECT
USING (true);

CREATE POLICY "Allow all inserts on categories_house"
ON categories_house FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all updates on categories_house"
ON categories_house FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all deletes on categories_house"
ON categories_house FOR DELETE
USING (true);

-- ============================================
-- Verify Changes
-- ============================================
-- Check services sequence
SELECT 
  last_value, 
  is_called 
FROM services_id_seq;

-- Check categories_house sequence
SELECT 
  last_value, 
  is_called 
FROM categories_house_id_seq;

-- Check services policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'services'
ORDER BY policyname;

-- Check categories_house policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'categories_house'
ORDER BY policyname;

