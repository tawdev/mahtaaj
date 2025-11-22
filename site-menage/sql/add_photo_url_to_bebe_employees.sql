-- إضافة الأعمدة المفقودة إلى جدول bebe_employees
-- Add missing columns to bebe_employees table

-- إضافة عمود photo_url
ALTER TABLE bebe_employees
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- إضافة عمود status
ALTER TABLE bebe_employees
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- إضافة عمود is_active
ALTER TABLE bebe_employees
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- تعليقات على الأعمدة (اختياري)
COMMENT ON COLUMN bebe_employees.photo_url IS 'رابط الصورة العامة من Supabase Storage';
COMMENT ON COLUMN bebe_employees.status IS 'حالة الموظف: pending, approved, rejected';
COMMENT ON COLUMN bebe_employees.is_active IS 'هل الموظف نشط أم لا';

