-- ============================================
-- جدول حجوزات Bébé Setting (Bebe Reservations)
-- ============================================
-- هذا الملف يحتوي على SQL لإنشاء جدول حجوزات Bébé Setting في Supabase
-- انسخ هذا الكود والصقه في Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS bebe_reservations (
  id BIGSERIAL PRIMARY KEY,
  
  -- معلومات المستخدم
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- معلومات الخدمة
  bebe_setting_id BIGINT REFERENCES bebe_settings(id) ON DELETE SET NULL,
  bebe_category_id BIGINT REFERENCES bebe_categories(id) ON DELETE SET NULL,
  
  -- معلومات العميل
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  location TEXT NOT NULL,
  
  -- معلومات الحجز
  reservation_date DATE,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('heures', 'jours')),
  
  -- للحجز بالساعات (heures)
  start_date DATE,
  start_time TIME,
  hours INTEGER,
  
  -- للحجز بالأيام (jours)
  start_date_jours DATE,
  end_date_jours DATE,
  days INTEGER,
  
  -- السعر والحالة
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  
  -- ملاحظات
  notes TEXT,
  admin_notes TEXT,
  
  -- التواريخ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- إنشاء Indexes لتحسين الأداء
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bebe_reservations_user_id ON bebe_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_bebe_reservations_bebe_setting_id ON bebe_reservations(bebe_setting_id);
CREATE INDEX IF NOT EXISTS idx_bebe_reservations_bebe_category_id ON bebe_reservations(bebe_category_id);
CREATE INDEX IF NOT EXISTS idx_bebe_reservations_status ON bebe_reservations(status);
CREATE INDEX IF NOT EXISTS idx_bebe_reservations_reservation_date ON bebe_reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_bebe_reservations_created_at ON bebe_reservations(created_at DESC);

-- ============================================
-- إنشاء Trigger لتحديث updated_at تلقائياً
-- ============================================

CREATE OR REPLACE FUNCTION update_bebe_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bebe_reservations_updated_at
  BEFORE UPDATE ON bebe_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_bebe_reservations_updated_at();

-- ============================================
-- تفعيل Row Level Security (RLS) - اختياري
-- ============================================

-- تفعيل RLS
ALTER TABLE bebe_reservations ENABLE ROW LEVEL SECURITY;

-- Policy للسماح للجميع بقراءة الحجوزات (يمكن تعديلها حسب الحاجة)
CREATE POLICY "Allow public read access to bebe_reservations"
  ON bebe_reservations
  FOR SELECT
  USING (true);

-- Policy للسماح للمستخدمين بإنشاء حجوزات خاصة بهم
CREATE POLICY "Allow users to insert their own reservations"
  ON bebe_reservations
  FOR INSERT
  WITH CHECK (true);

-- Policy للسماح للمستخدمين بتحديث حجوزاتهم الخاصة
CREATE POLICY "Allow users to update their own reservations"
  ON bebe_reservations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy للسماح للمسؤولين بتحديث جميع الحجوزات
-- (يحتاج إلى جدول roles أو طريقة للتحقق من صلاحيات المسؤول)
-- CREATE POLICY "Allow admins to update all reservations"
--   ON bebe_reservations
--   FOR UPDATE
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_roles 
--       WHERE user_id = auth.uid() 
--       AND role = 'admin'
--     )
--   );

-- ============================================
-- ملاحظات:
-- ============================================
-- 1. الجدول يدعم نوعين من الحجوزات:
--    - 'heures': يستخدم start_date, start_time, hours
--    - 'jours': يستخدم start_date_jours, end_date_jours, days
--
-- 2. الحقول المطلوبة:
--    - client_name
--    - client_phone
--    - location
--    - booking_type
--    - total_price
--
-- 3. الحقول الاختيارية:
--    - user_id (إذا كان المستخدم مسجل دخول)
--    - bebe_setting_id
--    - client_email
--    - notes
--
-- 4. Status القيم المسموحة:
--    - 'pending': في الانتظار
--    - 'confirmed': مؤكدة
--    - 'cancelled': ملغاة
--    - 'completed': مكتملة

