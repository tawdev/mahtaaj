-- ============================================
-- إنشاء جدول موظفي البستنة المعتمدين (Jardinage Employees Valid)
-- ============================================
-- انسخ هذا الكود والصقه في Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS jardinage_employees_valid (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES jardinage_employees(id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
  birth_date DATE,
  age INTEGER,
  email TEXT,
  phone TEXT,
  address TEXT,
  location TEXT,
  expertise TEXT,
  auto_entrepreneur TEXT,
  last_experience TEXT,
  company_name TEXT,
  photo TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_jardinage_employees_valid_employee_id ON jardinage_employees_valid(employee_id);
CREATE INDEX IF NOT EXISTS idx_jardinage_employees_valid_is_active ON jardinage_employees_valid(is_active);
CREATE INDEX IF NOT EXISTS idx_jardinage_employees_valid_created_at ON jardinage_employees_valid(created_at DESC);

-- تعليق على الجدول
COMMENT ON TABLE jardinage_employees_valid IS 'جدول موظفي البستنة المعتمدين - يتم نقل البيانات هنا عند الموافقة على التسجيل';

