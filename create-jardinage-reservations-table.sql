-- ============================================
-- جدول حجوزات Jardinage (Jardinage Reservations)
-- ============================================
-- هذا الملف يحتوي على SQL لإنشاء جدول حجوزات Jardinage في Supabase
-- انسخ هذا الكود والصقه في Supabase SQL Editor
-- ============================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS jardinage_reservations (
  id BIGSERIAL PRIMARY KEY,
  
  -- معلومات المستخدم
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- معلومات الخدمة
  jardinage_service_id BIGINT REFERENCES jardins(id) ON DELETE SET NULL,
  
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

-- Ajouter la colonne jardinage_category_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jardinage_reservations' 
      AND column_name = 'jardinage_category_id'
  ) THEN
    ALTER TABLE jardinage_reservations 
    ADD COLUMN jardinage_category_id BIGINT REFERENCES jardinage_categories(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Colonne jardinage_category_id ajoutée avec succès';
  ELSE
    RAISE NOTICE 'Colonne jardinage_category_id existe déjà';
  END IF;
END $$;

-- ============================================
-- إنشاء Indexes لتحسين الأداء
-- ============================================

CREATE INDEX IF NOT EXISTS idx_jardinage_reservations_user_id ON jardinage_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_jardinage_reservations_service_id ON jardinage_reservations(jardinage_service_id);
CREATE INDEX IF NOT EXISTS idx_jardinage_reservations_category_id ON jardinage_reservations(jardinage_category_id);
CREATE INDEX IF NOT EXISTS idx_jardinage_reservations_status ON jardinage_reservations(status);
CREATE INDEX IF NOT EXISTS idx_jardinage_reservations_created_at ON jardinage_reservations(created_at);

-- ============================================
-- إضافة Trigger لتحديث updated_at تلقائياً
-- ============================================

CREATE OR REPLACE FUNCTION update_jardinage_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_jardinage_reservations_updated_at ON jardinage_reservations;

CREATE TRIGGER update_jardinage_reservations_updated_at
  BEFORE UPDATE ON jardinage_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_jardinage_reservations_updated_at();

-- ============================================
-- إعداد Row Level Security (RLS)
-- ============================================

ALTER TABLE jardinage_reservations ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح للجميع بإنشاء حجوزات
DROP POLICY IF EXISTS "Allow all inserts on jardinage_reservations" ON jardinage_reservations;
CREATE POLICY "Allow all inserts on jardinage_reservations"
  ON jardinage_reservations
  FOR INSERT
  WITH CHECK (true);

-- سياسة للسماح للجميع بقراءة الحجوزات
DROP POLICY IF EXISTS "Allow all selects on jardinage_reservations" ON jardinage_reservations;
CREATE POLICY "Allow all selects on jardinage_reservations"
  ON jardinage_reservations
  FOR SELECT
  USING (true);

-- سياسة للسماح للمستخدمين بتحديث حجوزاتهم فقط
DROP POLICY IF EXISTS "Allow users to update own reservations" ON jardinage_reservations;
CREATE POLICY "Allow users to update own reservations"
  ON jardinage_reservations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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
--    - jardinage_service_id (إذا كان الحجز لخدمة محددة)
--    - jardinage_category_id (إذا كان الحجز لفئة محددة)
--    - client_email
--    - notes
--
-- 4. Status القيم المسموحة:
--    - 'pending': في الانتظار
--    - 'confirmed': مؤكدة
--    - 'cancelled': ملغاة
--    - 'completed': مكتملة
