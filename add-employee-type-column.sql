-- ============================================
-- إضافة عمود employee_type إلى الجداول
-- ============================================
-- انسخ هذا الكود والصقه في Supabase SQL Editor
-- ============================================

-- إضافة العمود إلى hand_worker_employees
ALTER TABLE hand_worker_employees 
ADD COLUMN IF NOT EXISTS employee_type TEXT CHECK (employee_type IN ('عامل', 'مساعد'));

-- إضافة العمود إلى hand_worker_employees_valid
ALTER TABLE hand_worker_employees_valid 
ADD COLUMN IF NOT EXISTS employee_type TEXT CHECK (employee_type IN ('عامل', 'مساعد'));

-- إضافة العمود إلى jardinage_employees
ALTER TABLE jardinage_employees 
ADD COLUMN IF NOT EXISTS employee_type TEXT CHECK (employee_type IN ('عامل', 'مساعد'));

-- إضافة العمود إلى jardinage_employees_valid
ALTER TABLE jardinage_employees_valid 
ADD COLUMN IF NOT EXISTS employee_type TEXT CHECK (employee_type IN ('عامل', 'مساعد'));

