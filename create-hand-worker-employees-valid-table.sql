-- ============================================
-- إنشاء جدول موظفي العمال اليدويين المعتمدين (Hand Worker Employees Valid)
-- ============================================
-- انسخ هذا الكود والصقه في Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS hand_worker_employees_valid (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES hand_worker_employees(id) ON DELETE SET NULL,
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
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_hand_worker_employees_valid_employee_id ON hand_worker_employees_valid(employee_id);
CREATE INDEX IF NOT EXISTS idx_hand_worker_employees_valid_category_id ON hand_worker_employees_valid(category_id);
CREATE INDEX IF NOT EXISTS idx_hand_worker_employees_valid_is_available ON hand_worker_employees_valid(is_available);
CREATE INDEX IF NOT EXISTS idx_hand_worker_employees_valid_created_at ON hand_worker_employees_valid(created_at DESC);

-- تعليق على الجدول
COMMENT ON TABLE hand_worker_employees_valid IS 'جدول موظفي العمال اليدويين المعتمدين - يتم نقل البيانات هنا عند الموافقة على التسجيل';

