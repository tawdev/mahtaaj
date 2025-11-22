-- ============================================
-- إكمال هيكل جدول bebe_employees
-- Complete bebe_employees table schema
-- ============================================

-- الأعمدة الموجودة حالياً:
-- Existing columns:
-- id (primary key, auto-generated)
-- first_name, last_name, email, phone, address, location, expertise, photo

-- إضافة الأعمدة المفقودة
-- Add missing columns

-- 1. إضافة عمود photo_url
ALTER TABLE bebe_employees
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. إضافة عمود status
ALTER TABLE bebe_employees
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 3. إضافة عمود is_active
ALTER TABLE bebe_employees
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- تعليقات على الأعمدة (اختياري)
COMMENT ON COLUMN bebe_employees.photo_url IS 'رابط الصورة العامة من Supabase Storage';
COMMENT ON COLUMN bebe_employees.status IS 'حالة الموظف: pending, approved, rejected';
COMMENT ON COLUMN bebe_employees.is_active IS 'هل الموظف نشط أم لا';

-- ============================================
-- التحقق من أن العمود id هو auto-increment
-- Verify that id column is auto-increment
-- ============================================

-- إذا كان id ليس auto-increment، قم بتشغيل هذا (عادة لا حاجة):
-- If id is not auto-increment, run this (usually not needed):
-- ALTER TABLE bebe_employees ALTER COLUMN id SET DEFAULT nextval('bebe_employees_id_seq');

-- ============================================
-- ملاحظات مهمة:
-- Important notes:
-- ============================================
-- 1. لا ترسل قيمة id عند INSERT - سيتم توليدها تلقائياً
--    Don't send id value on INSERT - it will be auto-generated
-- 2. تأكد من عدم وجود قيم مكررة في الأعمدة الفريدة (مثل email)
--    Ensure no duplicate values in unique columns (like email)
-- 3. بعد تشغيل هذا السكريبت، ستعمل جميع الأعمدة بشكل صحيح
--    After running this script, all columns will work correctly

