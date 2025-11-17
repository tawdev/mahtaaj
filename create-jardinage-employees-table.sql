-- ============================================
-- إنشاء جدول موظفي البستنة (Jardinage Employees)
-- ============================================
-- انسخ هذا الكود والصقه في Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS jardinage_employees (
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
  photo TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_jardinage_employees_status ON jardinage_employees(status);
CREATE INDEX IF NOT EXISTS idx_jardinage_employees_is_active ON jardinage_employees(is_active);
CREATE INDEX IF NOT EXISTS idx_jardinage_employees_created_at ON jardinage_employees(created_at DESC);

-- تعليق على الجدول
COMMENT ON TABLE jardinage_employees IS 'جدول موظفي البستنة - يتم حفظ بيانات التسجيل من صفحة /employees/register/jardinage';

