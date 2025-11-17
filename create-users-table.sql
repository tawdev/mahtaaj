-- ============================================
-- جدول المستخدمين (Users)
-- ============================================
-- هذا الجدول يخزن معلومات إضافية عن المستخدمين
-- مرتبط بجدول auth.users في Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'Morocco',
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  language_preference TEXT DEFAULT 'fr' CHECK (language_preference IN ('fr', 'ar', 'en')),
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- إنشاء Indexes لتحسين الأداء
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================
-- إنشاء Trigger لتحديث updated_at تلقائياً
-- ============================================
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- ============================================
-- إنشاء Trigger لإنشاء سجل في users عند إنشاء مستخدم جديد في auth.users
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء Trigger على auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يمكنهم قراءة بياناتهم فقط
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: المستخدمون يمكنهم تحديث بياناتهم فقط
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: يمكن للمستخدمين إدراج بياناتهم فقط (عند التسجيل)
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: الأدمن يمكنه قراءة جميع المستخدمين
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admins.is_active = true
    )
  );

-- Policy: الأدمن يمكنه تحديث جميع المستخدمين
CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admins.is_active = true
    )
  );

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE users IS 'جدول المستخدمين - معلومات إضافية عن المستخدمين';
COMMENT ON COLUMN users.id IS 'معرف المستخدم (مرتبط بـ auth.users)';
COMMENT ON COLUMN users.full_name IS 'الاسم الكامل للمستخدم';
COMMENT ON COLUMN users.phone IS 'رقم الهاتف';
COMMENT ON COLUMN users.address IS 'العنوان';
COMMENT ON COLUMN users.city IS 'المدينة';
COMMENT ON COLUMN users.zip_code IS 'الرمز البريدي';
COMMENT ON COLUMN users.country IS 'الدولة';
COMMENT ON COLUMN users.avatar_url IS 'رابط صورة الملف الشخصي';
COMMENT ON COLUMN users.date_of_birth IS 'تاريخ الميلاد';
COMMENT ON COLUMN users.gender IS 'الجنس';
COMMENT ON COLUMN users.language_preference IS 'اللغة المفضلة';
COMMENT ON COLUMN users.email_verified IS 'هل تم التحقق من البريد الإلكتروني';
COMMENT ON COLUMN users.phone_verified IS 'هل تم التحقق من رقم الهاتف';
COMMENT ON COLUMN users.is_active IS 'هل الحساب نشط';
COMMENT ON COLUMN users.last_login IS 'آخر تسجيل دخول';
COMMENT ON COLUMN users.metadata IS 'بيانات إضافية بصيغة JSON';

