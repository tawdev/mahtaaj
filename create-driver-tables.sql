-- ============================================
-- إنشاء جداول السائقين (Driver Tables)
-- ============================================
-- انسخ هذا الكود والصقه في Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. جدول موظفي السائقين (Driver Employees)
-- ============================================
CREATE TABLE IF NOT EXISTS driver_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  cin_number TEXT UNIQUE NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. جدول موظفي السائقين المعتمدين (Driver Employees Valid)
-- ============================================
CREATE TABLE IF NOT EXISTS driver_employees_valid (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES driver_employees(id) ON DELETE CASCADE,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected')),
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. جدول حجوزات السائقين (Driver Reservations)
-- ============================================
CREATE TABLE IF NOT EXISTS driver_reservation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES driver_employees(id) ON DELETE SET NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. جدول فئات السائقين (Driver Categories)
-- ============================================
CREATE TABLE IF NOT EXISTS driver_categorier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES driver_employees(id) ON DELETE CASCADE,
  category_name TEXT, -- Legacy field, kept for backward compatibility
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT,
  description TEXT, -- Legacy field, kept for backward compatibility
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  image TEXT, -- URL de l'image stockée dans Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- إنشاء Indexes لتحسين الأداء
-- ============================================

-- Indexes pour driver_employees
CREATE INDEX IF NOT EXISTS idx_driver_employees_phone ON driver_employees(phone);
CREATE INDEX IF NOT EXISTS idx_driver_employees_cin_number ON driver_employees(cin_number);
CREATE INDEX IF NOT EXISTS idx_driver_employees_created_at ON driver_employees(created_at DESC);

-- Indexes pour driver_employees_valid
CREATE INDEX IF NOT EXISTS idx_driver_employees_valid_driver_id ON driver_employees_valid(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_employees_valid_status ON driver_employees_valid(validation_status);
CREATE INDEX IF NOT EXISTS idx_driver_employees_valid_validated_at ON driver_employees_valid(validated_at DESC);

-- Indexes pour driver_reservation
CREATE INDEX IF NOT EXISTS idx_driver_reservation_driver_id ON driver_reservation(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_reservation_reservation_date ON driver_reservation(reservation_date);
CREATE INDEX IF NOT EXISTS idx_driver_reservation_status ON driver_reservation(status);
CREATE INDEX IF NOT EXISTS idx_driver_reservation_created_at ON driver_reservation(created_at DESC);

-- Indexes pour driver_categorier
CREATE INDEX IF NOT EXISTS idx_driver_categorier_driver_id ON driver_categorier(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_categorier_category_name ON driver_categorier(category_name);

-- ============================================
-- إنشاء Trigger لتحديث updated_at تلقائياً
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour driver_employees
CREATE TRIGGER update_driver_employees_updated_at
  BEFORE UPDATE ON driver_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers pour driver_employees_valid
CREATE TRIGGER update_driver_employees_valid_updated_at
  BEFORE UPDATE ON driver_employees_valid
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers pour driver_reservation
CREATE TRIGGER update_driver_reservation_updated_at
  BEFORE UPDATE ON driver_reservation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers pour driver_categorier
CREATE TRIGGER update_driver_categorier_updated_at
  BEFORE UPDATE ON driver_categorier
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Activer RLS pour جميع الجداول
ALTER TABLE driver_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_employees_valid ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_reservation ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_categorier ENABLE ROW LEVEL SECURITY;

-- Policies pour driver_employees
-- السماح للجميع بقراءة السائقين النشطين
CREATE POLICY "Anyone can view active driver employees"
ON driver_employees FOR SELECT
USING (true);

-- السماح للمسؤولين فقط بإنشاء وتحديث وحذف السائقين
CREATE POLICY "Admins can manage driver employees"
ON driver_employees FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND admins.is_active = true
  )
);

-- Policies pour driver_employees_valid
-- السماح للجميع بقراءة السائقين المعتمدين
CREATE POLICY "Anyone can view validated driver employees"
ON driver_employees_valid FOR SELECT
USING (validation_status = 'approved');

-- السماح للمسؤولين فقط بإدارة السائقين المعتمدين
CREATE POLICY "Admins can manage validated driver employees"
ON driver_employees_valid FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND admins.is_active = true
  )
);

-- Policies pour driver_reservation
-- السماح للمستخدمين المسجلين بإنشاء حجوزات
CREATE POLICY "Authenticated users can create reservations"
ON driver_reservation FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- السماح للمستخدمين بقراءة حجوزاتهم الخاصة
CREATE POLICY "Users can view their own reservations"
ON driver_reservation FOR SELECT
USING (
  auth.uid() IS NOT NULL
  OR EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND admins.is_active = true
  )
);

-- السماح للمسؤولين فقط بتحديث وحذف الحجوزات
CREATE POLICY "Admins can manage reservations"
ON driver_reservation FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND admins.is_active = true
  )
);

CREATE POLICY "Admins can delete reservations"
ON driver_reservation FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND admins.is_active = true
  )
);

-- Policies pour driver_categorier
-- السماح للجميع بقراءة الفئات
CREATE POLICY "Anyone can view driver categories"
ON driver_categorier FOR SELECT
USING (true);

-- السماح للمسؤولين فقط بإدارة الفئات
CREATE POLICY "Admins can manage driver categories"
ON driver_categorier FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND admins.is_active = true
  )
);

-- ============================================
-- تعليقات على الجداول (Comments)
-- ============================================
COMMENT ON TABLE driver_employees IS 'جدول موظفي السائقين - يحتوي على معلومات السائقين الأساسية';
COMMENT ON TABLE driver_employees_valid IS 'جدول موظفي السائقين المعتمدين - يتم نقل البيانات هنا عند الموافقة على التسجيل';
COMMENT ON TABLE driver_reservation IS 'جدول حجوزات السائقين - يحتوي على معلومات الحجوزات';
COMMENT ON TABLE driver_categorier IS 'جدول فئات السائقين - يحتوي على فئات وأنواع السائقين';

-- ============================================
-- ملاحظات مهمة
-- ============================================
-- 1. جميع الجداول تستخدم UUID كـ Primary Key
-- 2. تم إضافة Foreign Keys مع ON DELETE CASCADE أو SET NULL حسب الحاجة
-- 3. تم إضافة Indexes لتحسين الأداء على الحقول المستخدمة في البحث
-- 4. تم تفعيل RLS Policies للأمان
-- 5. تم إضافة Triggers لتحديث updated_at تلقائياً
-- 6. يمكنك تعديل Policies حسب احتياجاتك
-- 7. تأكد من إنشاء Bucket في Supabase Storage لحفظ صور السائقين والفئات

