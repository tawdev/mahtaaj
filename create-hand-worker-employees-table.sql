-- ============================================
-- إنشاء جدول موظفي العمال اليدويين (Hand Worker Employees)
-- ============================================
-- انسخ هذا الكود والصقه في Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS hand_worker_employees (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  category_id BIGINT REFERENCES hand_worker_categories(id) ON DELETE SET NULL,
  address TEXT,
  city TEXT,
  photo TEXT,
  photo_url TEXT,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  is_available BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_hand_worker_employees_status ON hand_worker_employees(status);
CREATE INDEX IF NOT EXISTS idx_hand_worker_employees_is_available ON hand_worker_employees(is_available);
CREATE INDEX IF NOT EXISTS idx_hand_worker_employees_category_id ON hand_worker_employees(category_id);
CREATE INDEX IF NOT EXISTS idx_hand_worker_employees_created_at ON hand_worker_employees(created_at DESC);

-- تعليق على الجدول
COMMENT ON TABLE hand_worker_employees IS 'جدول موظفي العمال اليدويين - يتم حفظ بيانات التسجيل من صفحة /employees/register/handworker';

