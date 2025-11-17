-- ============================================
-- إنشاء جدول موظفي الأمن (Security Employees)
-- ============================================
-- انسخ هذا الكود والصقه في Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS security_employees (
  id BIGSERIAL PRIMARY KEY,
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
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_security_employees_status ON security_employees(status);
CREATE INDEX IF NOT EXISTS idx_security_employees_is_active ON security_employees(is_active);
CREATE INDEX IF NOT EXISTS idx_security_employees_created_at ON security_employees(created_at DESC);

-- تعليق على الجدول
COMMENT ON TABLE security_employees IS 'جدول موظفي الأمن - يتم حفظ بيانات التسجيل من صفحة /employees/register/security';

