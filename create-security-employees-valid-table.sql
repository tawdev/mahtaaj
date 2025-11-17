-- ============================================
-- إنشاء جدول موظفي الأمن المعتمدين (Security Employees Valid)
-- ============================================
-- انسخ هذا الكود والصقه في Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS security_employees_valid (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES security_employees(id) ON DELETE SET NULL,
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
  preferred_work_time TEXT,
  photo TEXT,
  photo_url TEXT,
  availability JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_security_employees_valid_employee_id ON security_employees_valid(employee_id);
CREATE INDEX IF NOT EXISTS idx_security_employees_valid_is_active ON security_employees_valid(is_active);
CREATE INDEX IF NOT EXISTS idx_security_employees_valid_created_at ON security_employees_valid(created_at DESC);

-- تعليق على الجدول
COMMENT ON TABLE security_employees_valid IS 'جدول موظفي الأمن المعتمدين - يتم نقل البيانات هنا عند الموافقة على التسجيل';

