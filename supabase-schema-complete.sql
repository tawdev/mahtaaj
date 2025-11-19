-- ============================================
-- دليل إنشاء قاعدة البيانات في Supabase
-- ============================================
-- هذا الملف يحتوي على جميع الجداول المطلوبة لموقع الخدمات
-- انسخ هذا الكود والصقه في Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. جدول الخدمات (Services)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  name_fr TEXT,
  name_ar TEXT,
  name_en TEXT,
  description_fr TEXT,
  description_ar TEXT,
  description_en TEXT,
  slug TEXT UNIQUE,
  price_per_m2 DECIMAL(10,2),
  price_4h DECIMAL(10,2),
  extra_hour_price DECIMAL(10,2),
  images JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. جدول فئات المنازل (Categories House)
-- ============================================
CREATE TABLE IF NOT EXISTS categories_house (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT REFERENCES services(id) ON DELETE CASCADE,
  name TEXT,
  name_fr TEXT,
  name_ar TEXT,
  name_en TEXT,
  description_fr TEXT,
  description_ar TEXT,
  description_en TEXT,
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. جدول الأنواع (Types)
-- ============================================
CREATE TABLE IF NOT EXISTS types (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT REFERENCES services(id) ON DELETE CASCADE,
  category_house_id BIGINT REFERENCES categories_house(id) ON DELETE CASCADE,
  category_id BIGINT, -- يمكن أن يكون NULL
  name_fr TEXT,
  name_ar TEXT,
  name_en TEXT,
  description_fr TEXT,
  description_ar TEXT,
  description_en TEXT,
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. جدول خيارات الأنواع (Type Options)
-- ============================================
CREATE TABLE IF NOT EXISTS type_options (
  id BIGSERIAL PRIMARY KEY,
  type_id BIGINT REFERENCES types(id) ON DELETE CASCADE,
  name_fr TEXT,
  name_ar TEXT,
  name_en TEXT,
  description_fr TEXT,
  description_ar TEXT,
  description_en TEXT,
  image TEXT,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. جدول الحجوزات (Reservations)
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  firstname TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  service TEXT,
  type TEXT,
  type_id BIGINT REFERENCES types(id) ON DELETE SET NULL,
  choixtype_id BIGINT REFERENCES type_options(id) ON DELETE SET NULL,
  size DECIMAL(10,2),
  total_price DECIMAL(10,2),
  message TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  preferred_date TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. جدول التقييمات (Ratings)
-- ============================================
CREATE TABLE IF NOT EXISTS ratings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_ip TEXT,
  user_agent TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  product_id BIGINT, -- يمكن أن يكون NULL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. جدول الفئات (Categories) - للمنتجات
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. جدول أنواع المنتجات (Product Types)
-- ============================================
CREATE TABLE IF NOT EXISTS product_types (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. جدول المنتجات (Products)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT,
  description TEXT,
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  slug TEXT UNIQUE,
  price DECIMAL(10,2),
  image TEXT,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  type_id BIGINT REFERENCES product_types(id) ON DELETE SET NULL,
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. جدول الطلبات (Orders)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  zip TEXT,
  notes TEXT,
  payment_method TEXT CHECK (payment_method IN ('online', 'cod')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'completed', 'cancelled')),
  total DECIMAL(10,2) DEFAULT 0,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. جدول السلة (Cart)
-- ============================================
CREATE TABLE IF NOT EXISTS carts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- 12. جدول رسائل الاتصال (Contact Submissions)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id BIGSERIAL PRIMARY KEY,
  firstname TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT,
  service TEXT,
  message TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. جدول المستخدمين (Users)
-- ============================================
-- هذا الجدول يخزن معلومات إضافية عن المستخدمين
-- مرتبط بجدول auth.users في Supabase
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
-- 14. جدول الأدمن (Admins)
-- ============================================
-- ملاحظة: يمكن استخدام Supabase Auth بدلاً من هذا الجدول
-- أو استخدام جدول منفصل مع RLS
CREATE TABLE IF NOT EXISTS admins (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- في الإنتاج، استخدم Supabase Auth
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 15. جدول الموظفين (Employees)
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo TEXT,
  photo_url TEXT,
  address TEXT,
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 16. جدول أنواع فئات المعرض (Type Category Gallery)
-- ============================================
CREATE TABLE IF NOT EXISTS type_category_gallery (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 17. جدول فئات المعرض (Category Gallery)
-- ============================================
CREATE TABLE IF NOT EXISTS category_gallery (
  id BIGSERIAL PRIMARY KEY,
  type_category_gallery_id BIGINT,
  name TEXT,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT,
  slug TEXT,
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 17. جدول المعرض (Gallery)
-- ============================================
CREATE TABLE IF NOT EXISTS gallery (
  id BIGSERIAL PRIMARY KEY,
  category_gallery_id BIGINT REFERENCES category_gallery(id) ON DELETE SET NULL,
  image_path TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 18. جدول فئات الطفل (Bebe Categories)
-- ============================================
CREATE TABLE IF NOT EXISTS bebe_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT,
  slug TEXT,
  description TEXT,
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 19. جدول موظفي الطفل (Bebe Employees)
-- ============================================
CREATE TABLE IF NOT EXISTS bebe_employees (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
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
  availability JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 20. جدول موظفي الطفل المعتمدين (Bebe Employees Valid)
-- ============================================
CREATE TABLE IF NOT EXISTS bebe_employees_valid (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT REFERENCES bebe_employees(id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
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
  availability JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 21. جدول إعدادات الطفل (Bebe Settings)
-- ============================================
CREATE TABLE IF NOT EXISTS bebe_settings (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT REFERENCES bebe_categories(id) ON DELETE SET NULL,
  nom TEXT,
  photo TEXT,
  description TEXT,
  price DECIMAL(10,2),
  duration TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT,
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  slug TEXT,
  "order" INTEGER DEFAULT 0
);

-- ============================================
-- 22. جدول الكفاءات (Competencies)
-- ============================================
CREATE TABLE IF NOT EXISTS competencies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 23. جدول فئات العمال اليدويين (Hand Worker Categories)
-- ============================================
CREATE TABLE IF NOT EXISTS hand_worker_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT,
  slug TEXT,
  description TEXT,
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  icon TEXT,
  image TEXT,
  price_per_hour DECIMAL(10,2),
  minimum_hours INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 24. جدول العمال اليدويين (Hand Workers)
-- ============================================
CREATE TABLE IF NOT EXISTS hand_workers (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  category_id BIGINT REFERENCES hand_worker_categories(id) ON DELETE SET NULL,
  photo TEXT,
  status TEXT DEFAULT 'available',
  experience_years INTEGER,
  rating DECIMAL(3,2),
  bio TEXT,
  address TEXT,
  city TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 24.1. جدول موظفي العمال اليدويين (Hand Worker Employees)
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
  employee_type TEXT CHECK (employee_type IN ('عامل', 'مساعد')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  is_available BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 24.2. جدول موظفي العمال اليدويين المعتمدين (Hand Worker Employees Valid)
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
  employee_type TEXT CHECK (employee_type IN ('عامل', 'مساعد')),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 25. جدول فئات البستنة (Jardinage Categories)
-- ============================================
CREATE TABLE IF NOT EXISTS jardinage_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT,
  slug TEXT,
  description TEXT,
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 25.1. جدول خدمات البستنة (Jardins)
-- ============================================
CREATE TABLE IF NOT EXISTS jardins (
  id BIGSERIAL PRIMARY KEY,
  jardinage_category_id BIGINT REFERENCES jardinage_categories(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  price DECIMAL(10,2),
  duration INTEGER,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 25.2. جدول موظفي البستنة (Jardinage Employees)
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
  employee_type TEXT CHECK (employee_type IN ('عامل', 'مساعد')),
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

-- ============================================
-- 25.3. جدول موظفي البستنة المعتمدين (Jardinage Employees Valid)
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
  employee_type TEXT CHECK (employee_type IN ('عامل', 'مساعد')),
  auto_entrepreneur TEXT,
  last_experience TEXT,
  company_name TEXT,
  photo TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 26. جدول العروض الترويجية (Promotions)
-- ============================================
CREATE TABLE IF NOT EXISTS promotions (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount DECIMAL(5,2) NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 27. جدول حراس الأمن (Securities) - Legacy table
-- ============================================
CREATE TABLE IF NOT EXISTS securities (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo TEXT,
  photo_url TEXT,
  address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 27.1. جدول موظفي الأمن (Security Employees)
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

-- ============================================
-- 27.2. جدول موظفي الأمن المعتمدين (Security Employees Valid)
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

-- ============================================
-- 28. جدول أدوار الأمن (Security Roles)
-- ============================================
CREATE TABLE IF NOT EXISTS security_roles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  name_ar TEXT,
  name_fr TEXT,
  name_en TEXT,
  description TEXT,
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 29. جدول حجوزات الأمن (Security Reservations)
-- ============================================
CREATE TABLE IF NOT EXISTS reserve_security (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  security_id BIGINT REFERENCES securities(id) ON DELETE SET NULL,
  firstname TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  email TEXT,
  message TEXT,
  total_price DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  preferred_date TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- إنشاء Indexes لتحسين الأداء
-- ============================================
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON services(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_house_service_id ON categories_house(service_id);
CREATE INDEX IF NOT EXISTS idx_types_service_id ON types(service_id);
CREATE INDEX IF NOT EXISTS idx_types_category_house_id ON types(category_house_id);
CREATE INDEX IF NOT EXISTS idx_type_options_type_id ON type_options(type_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_type_id ON reservations(type_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_securities_status ON securities(status);
CREATE INDEX IF NOT EXISTS idx_securities_is_active ON securities(is_active);
CREATE INDEX IF NOT EXISTS idx_security_roles_is_active ON security_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_security_roles_order ON security_roles("order");
CREATE INDEX IF NOT EXISTS idx_reserve_security_user_id ON reserve_security(user_id);
CREATE INDEX IF NOT EXISTS idx_reserve_security_security_id ON reserve_security(security_id);
CREATE INDEX IF NOT EXISTS idx_reserve_security_status ON reserve_security(status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================
-- إنشاء Functions لتحديث updated_at تلقائياً
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق Trigger على جميع الجداول
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_house_updated_at BEFORE UPDATE ON categories_house
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_types_updated_at BEFORE UPDATE ON types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_type_options_updated_at BEFORE UPDATE ON type_options
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bebe_categories_updated_at BEFORE UPDATE ON bebe_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bebe_employees_updated_at BEFORE UPDATE ON bebe_employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bebe_employees_valid_updated_at BEFORE UPDATE ON bebe_employees_valid
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bebe_settings_updated_at BEFORE UPDATE ON bebe_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competencies_updated_at BEFORE UPDATE ON competencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hand_worker_categories_updated_at BEFORE UPDATE ON hand_worker_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hand_workers_updated_at BEFORE UPDATE ON hand_workers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jardinage_categories_updated_at BEFORE UPDATE ON jardinage_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_gallery_updated_at BEFORE UPDATE ON category_gallery
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_updated_at BEFORE UPDATE ON gallery
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_securities_updated_at BEFORE UPDATE ON securities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_roles_updated_at BEFORE UPDATE ON security_roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reserve_security_updated_at BEFORE UPDATE ON reserve_security
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- إعداد Row Level Security (RLS)
-- ============================================

-- تفعيل RLS على الجداول
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_house ENABLE ROW LEVEL SECURITY;
ALTER TABLE types ENABLE ROW LEVEL SECURITY;
ALTER TABLE type_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policies للمستخدمين (Users)
-- ============================================
-- السماح للمستخدمين بقراءة بياناتهم فقط
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- السماح للمستخدمين بتحديث بياناتهم فقط
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- السماح للمستخدمين بإدراج بياناتهم فقط (عند التسجيل)
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- السماح للأدمن بقراءة جميع المستخدمين
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

-- السماح للأدمن بتحديث جميع المستخدمين
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
-- Trigger لإنشاء سجل في users عند إنشاء مستخدم جديد في auth.users
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
-- Policies للخدمات (Services)
-- ============================================
-- السماح للجميع بقراءة الخدمات النشطة
CREATE POLICY "Anyone can view active services"
ON services FOR SELECT
USING (is_active = true);

-- Allow admin to create services
CREATE POLICY "Allow all inserts on services"
ON services FOR INSERT
WITH CHECK (true);

-- Allow admin to update services
CREATE POLICY "Allow all updates on services"
ON services FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow admin to delete services
CREATE POLICY "Allow all deletes on services"
ON services FOR DELETE
USING (true);

-- ============================================
-- Policies لـ categories_house
-- ============================================
-- Allow everyone to read categories_house
CREATE POLICY "Allow all selects on categories_house"
ON categories_house FOR SELECT
USING (true);

-- Allow admin to create categories_house
CREATE POLICY "Allow all inserts on categories_house"
ON categories_house FOR INSERT
WITH CHECK (true);

-- Allow admin to update categories_house
CREATE POLICY "Allow all updates on categories_house"
ON categories_house FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow admin to delete categories_house
CREATE POLICY "Allow all deletes on categories_house"
ON categories_house FOR DELETE
USING (true);

-- ============================================
-- Policies للحجوزات (Reservations)
-- ============================================
-- السماح للجميع بإنشاء حجوزات
CREATE POLICY "Anyone can create reservations"
ON reservations FOR INSERT
WITH CHECK (true);

-- السماح للمستخدمين بقراءة حجوزاتهم فقط
CREATE POLICY "Users can view their own reservations"
ON reservations FOR SELECT
USING (
  auth.uid() = user_id OR 
  user_id IS NULL -- للحجوزات بدون تسجيل دخول
);

-- ============================================
-- Policies للمنتجات (Products)
-- ============================================
-- السماح للجميع بقراءة المنتجات المتوفرة
CREATE POLICY "Anyone can view available products"
ON products FOR SELECT
USING (in_stock = true);

-- ============================================
-- Policies للطلبات (Orders)
-- ============================================
-- السماح للمستخدمين بإنشاء طلبات
CREATE POLICY "Anyone can create orders"
ON orders FOR INSERT
WITH CHECK (true);

-- السماح للمستخدمين بقراءة طلباتهم فقط
CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
USING (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- ============================================
-- Policies للسلة (Cart)
-- ============================================
-- السماح للمستخدمين المسجلين فقط بإدارة السلة
CREATE POLICY "Users can manage their own cart"
ON carts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Policies لرسائل الاتصال (Contact Submissions)
-- ============================================
-- السماح للجميع بإنشاء رسائل
CREATE POLICY "Anyone can create contact submissions"
ON contact_submissions FOR INSERT
WITH CHECK (true);

-- ============================================
-- Policies للتقييمات (Ratings)
-- ============================================
-- السماح للجميع بإنشاء تقييمات
CREATE POLICY "Anyone can create ratings"
ON ratings FOR INSERT
WITH CHECK (true);

-- السماح للجميع بقراءة التقييمات
CREATE POLICY "Anyone can view ratings"
ON ratings FOR SELECT
USING (true);

-- ============================================
-- ملاحظات مهمة
-- ============================================
-- 1. يمكنك تعديل Policies حسب احتياجاتك
-- 2. للحصول على صلاحيات Admin، يمكنك:
--    - استخدام Supabase Auth مع Custom Claims
--    - أو إنشاء جدول admins منفصل مع RLS مخصص
-- 3. تأكد من تحديث RLS Policies بعد إنشاء الجداول
-- 4. يمكنك إضافة المزيد من الجداول حسب احتياجاتك

-- ============================================
-- إدراج البيانات الأولية (Initial Data)
-- ============================================

-- إدراج بيانات الأدمن (Admins)
INSERT INTO admins (id, email, name, role, is_active, password, created_at, updated_at) VALUES
(1, 'admin@example.com', NULL, 'admin', true, '$2y$12$YGB4HuW50NYb5KbbzIqWROuCMRCZ6iwZAZ5xlDwpxEpnnktvUM0WG', '2025-10-11 06:11:14', '2025-10-13 08:52:38'),
(2, 'admin@test.com', NULL, 'admin', true, '$2y$12$pVah5ujXnfZOGxxgJDnP.OCiGCQgzkJZwR0F/Tog6gGudPI/9fwNO', '2025-10-11 12:19:01', '2025-10-11 12:19:01'),
(4, 'jardin@gmail.com', 'jardin', 'adminJardinaje', true, '$2y$12$jxoN/vQuB6jZzsLJ2.J5R.ob4z5Q.L9W7z.Ind3RESLRyC2SaqplS', '2025-10-30 07:11:05', '2025-10-30 07:11:05'),
(5, 'bebe@gmail.com', 'bebe', 'adminBebe', true, '$2y$12$yF1PQPL8i2BXWD/98UW7mOGu.M7rWBUvHHdyCOMpLQHFOCH2Ts2uW', '2025-10-30 07:11:37', '2025-10-30 07:11:37'),
(6, 'house@gmail.com', 'house', 'adminHouseKeeping', true, '$2y$12$LyYsMgagGWlViBIqYbs1CuZKV6uvLzI3Zt6JdO373N9BjRlVFeDza', '2025-10-30 07:12:08', '2025-10-30 07:12:08'),
(7, 'security@gmail.com', 'security', 'adminSecurity', true, '$2y$12$kEHEYligZDz3SIXFzkqEFu5FaVJ9IdPFSJFi3vAajR55LiHQ2Yv5G', '2025-10-30 07:12:35', '2025-10-30 07:12:35'),
(8, 'hande@gmail.com', 'hande', 'adminHandWorker', true, '$2y$12$IPOjjIR5Mu3BnM0jPokCe.lta9T0gongX8bOB.4as1WKrtMfcSgOy', '2025-10-30 07:13:02', '2025-10-30 07:13:02')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  password = EXCLUDED.password,
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات فئات الطفل (Bebe Categories)
INSERT INTO bebe_categories (id, name, name_ar, name_fr, name_en, slug, description, description_ar, description_fr, description_en, image, is_active, "order", created_at, updated_at) VALUES
(1, 'Chambre Bébé', 'غرفة الطفل', 'Chambre Bébé', 'Baby Room', NULL, 'Aménagement et décoration de chambre pour bébé', 'ترتيب وتزيين غرفة الطفل', 'Aménagement et décoration de chambre pour bébé', 'Baby room layout and decoration', '/images/bebe/chambre.jpg', true, 0, '2025-10-22 09:04:11', '2025-10-31 09:20:29'),
(2, 'Mobilier Bébé', 'أثاث الطفل', 'Mobilier Bébé', 'Baby Furniture', NULL, 'Sélection et installation de mobilier adapté aux bébés', 'اختيار وتركيب الأثاث المناسب للأطفال', 'Sélection et installation de mobilier adapté aux bébés', 'Selection and installation of furniture suitable for babies', '/images/bebe/mobilier.jpg', true, 0, '2025-10-22 09:04:11', '2025-10-31 09:22:05'),
(3, 'Décoration Bébé', 'ديكور الطفل', 'Décoration Bébé', 'Baby Decoration', NULL, 'Décoration et accessoires pour créer un environnement douillet', 'تزيين واكسسوارات لخلق بيئة ممتعة للطفل', 'Décoration et accessoires pour créer un environnement douillet', 'Decoration and accessories to create a pleasant environment for the baby', '/images/bebe/decoration.jpg', true, 0, '2025-10-22 09:04:11', '2025-10-31 09:22:43'),
(4, 'Sécurité Bébé', 'سلامة الطفل', 'Sécurité Bébé', 'Baby Safety', NULL, 'Installation d''équipements de sécurité pour protéger bébé', 'تركيب معدات السلامة لحماية الطفل', 'Installation d''équipements de sécurité pour protéger bébé', 'Installation of safety equipment to protect the baby', '/images/bebe/securite.jpg', true, 0, '2025-10-22 09:04:11', '2025-10-31 09:23:29')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en,
  image = EXCLUDED.image,
  is_active = EXCLUDED.is_active,
  "order" = EXCLUDED."order",
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات موظفي الطفل (Bebe Employees)
INSERT INTO bebe_employees (id, first_name, last_name, age, email, phone, address, location, expertise, auto_entrepreneur, last_experience, company_name, preferred_work_time, photo, availability, is_active, created_at, updated_at) VALUES
(1, 'mehdi', 'mehdi', 18, 'mehdi@gmail.com', '0909090909', 'hdhhshs', 'skkskskks', 'مربية أطفال', NULL, NULL, NULL, NULL, NULL, '{"السبت":{"start":"18:50","end":"12:55"},"الأحد":{"start":"","end":""},"الإثنين":{"start":"","end":""},"الثلاثاء":{"start":"","end":""},"الأربعاء":{"start":"","end":""},"الخميس":{"start":"","end":""},"الجمعة":{"start":"","end":""}}', true, '2025-10-31 11:45:55', '2025-10-31 11:45:55')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  age = EXCLUDED.age,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  location = EXCLUDED.location,
  expertise = EXCLUDED.expertise,
  auto_entrepreneur = EXCLUDED.auto_entrepreneur,
  last_experience = EXCLUDED.last_experience,
  company_name = EXCLUDED.company_name,
  preferred_work_time = EXCLUDED.preferred_work_time,
  photo = EXCLUDED.photo,
  availability = EXCLUDED.availability,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات موظفي الطفل المعتمدين (Bebe Employees Valid)
INSERT INTO bebe_employees_valid (id, employee_id, first_name, last_name, age, email, phone, address, location, expertise, auto_entrepreneur, last_experience, company_name, preferred_work_time, photo, availability, is_active, created_at, updated_at) VALUES
(1, 1, 'mehdi', 'mehdi', 18, 'mehdi@gmail.com', '0909090909', 'hdhhshs', 'skkskskks', 'مربية أطفال', NULL, NULL, NULL, NULL, NULL, '{"السبت":{"start":"18:50","end":"12:55"},"الأحد":{"start":"","end":""},"الإثنين":{"start":"","end":""},"الثلاثاء":{"start":"","end":""},"الأربعاء":{"start":"","end":""},"الخميس":{"start":"","end":""},"الجمعة":{"start":"","end":""}}', true, '2025-10-31 11:52:29', '2025-10-31 11:52:29')
ON CONFLICT (id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  age = EXCLUDED.age,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  location = EXCLUDED.location,
  expertise = EXCLUDED.expertise,
  auto_entrepreneur = EXCLUDED.auto_entrepreneur,
  last_experience = EXCLUDED.last_experience,
  company_name = EXCLUDED.company_name,
  preferred_work_time = EXCLUDED.preferred_work_time,
  photo = EXCLUDED.photo,
  availability = EXCLUDED.availability,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات إعدادات الطفل (Bebe Settings)
-- ملاحظة: تم تقصير البيانات الطويلة للصور (base64) لتوفير المساحة
INSERT INTO bebe_settings (id, category_id, nom, photo, description, price, duration, is_active, created_at, updated_at, name_ar, name_fr, name_en, description_ar, description_fr, description_en, slug, "order") VALUES
(1, 2, 'Chambre Bébé', 'data:image/jpeg;base64,...', 'Aménagement complet de la chambre de bébé, du mobilier à la décoration, pour un espace sûr et apaisant.', 123.00, '6', true, '2025-10-22 15:07:25', '2025-11-07 08:54:52', 'غرفة الطفل', 'Chambre Bébé', 'Baby Room', 'تصميم وتجهيز كامل لغرفة الطفل، من الأثاث إلى الديكور، لخلق مساحة مريحة وآمنة لنوم الطفل ونشاطه اليومي.', 'Aménagement complet de la chambre de bébé, du mobilier à la décoration, pour un espace sûr et apaisant.', 'Complete setup of the baby''s room — from furniture to decoration — creating a safe and cozy space for rest and play.', NULL, 0),
(2, 1, 'Mobilier Bébé', 'data:image/jpeg;base64,...', 'Une sélection de meubles pour bébés : lits, tables, chaises et armoires conçus pour le confort et la sécurité.', 1234.00, '6', true, '2025-10-23 10:11:11', '2025-11-07 08:56:14', 'أثاث الأطفال', 'Mobilier Bébé', 'Baby Furniture', 'تشكيلة من الأثاث المخصص للأطفال مثل الأسرّة، الطاولات، الكراسي والخزائن المصممة بأمان وراحة عالية.', 'Une sélection de meubles pour bébés : lits, tables, chaises et armoires conçus pour le confort et la sécurité.', 'A selection of baby furniture — cribs, tables, chairs, and wardrobes designed for safety and comfort.', NULL, 0),
(3, 3, 'Décoration Bébé', 'data:image/jpeg;base64,...', 'Des touches décoratives pour la chambre de votre bébé : stickers, tableaux, couleurs douces et lumières apaisantes.', 123.00, '8', true, '2025-10-23 10:12:15', '2025-11-07 08:57:34', 'ديكور غرفة الطفل', 'Décoration Bébé', 'Baby Decoration', 'لمسات جمالية لغرفة طفلك تشمل الملصقات، اللوحات، الألوان الهادئة والإضاءة الناعمة لخلق جو مريح ودافئ.', 'Des touches décoratives pour la chambre de votre bébé : stickers, tableaux, couleurs douces et lumières apaisantes.', 'Decorative touches for your baby''s room — wall stickers, paintings, soft colors, and soothing lights for a warm atmosphere.', NULL, 0),
(4, 4, 'Sécurité Bébé', 'data:image/jpeg;base64,...', 'Produits et accessoires assurant la sécurité de votre bébé à la maison : protections d''angles, verrous de portes, barrières d''escaliers et plus encore.', 1234.00, '4', true, '2025-10-23 10:12:45', '2025-11-07 08:59:36', 'أمان الطفل', 'Sécurité Bébé', 'Baby Safety', 'منتجات وأدوات تضمن حماية طفلك داخل المنزل، مثل واقيات الزوايا، أقفال الأبواب، وحواجز السلالم لتوفير بيئة آمنة ومريحة.', 'Produits et accessoires assurant la sécurité de votre bébé à la maison : protections d''angles, verrous de portes, barrières d''escaliers et plus encore.', 'Products and accessories designed to keep your baby safe at home — corner guards, door locks, stair gates, and more.', NULL, 0)
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  nom = EXCLUDED.nom,
  photo = EXCLUDED.photo,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration = EXCLUDED.duration,
  is_active = EXCLUDED.is_active,
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  description_ar = EXCLUDED.description_ar,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en,
  slug = EXCLUDED.slug,
  "order" = EXCLUDED."order",
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات الفئات (Categories)
INSERT INTO categories (id, name, name_ar, name_fr, name_en, slug, description, description_ar, description_fr, description_en, is_active, "order", created_at, updated_at) VALUES
(1, 'Accessoire', 'إكسسوار', 'Accessoire', 'Accessory', 'accessoire', 'Catégorie des accessoires de nettoyage et équipements.', NULL, 'Catégorie des accessoires de nettoyage et équipements.', NULL, true, 0, '2025-10-13 10:27:11', '2025-10-13 10:27:11'),
(2, 'Produit', 'منتج', 'Produit', 'Product', 'produit', 'Catégorie des produits de nettoyage.', NULL, 'Catégorie des produits de nettoyage.', NULL, true, 0, '2025-10-13 10:27:11', '2025-10-13 10:27:11')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en,
  is_active = EXCLUDED.is_active,
  "order" = EXCLUDED."order",
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات الخدمات (Services) - يجب أن تكون قبل categories_house
INSERT INTO services (id, name_fr, name_ar, name_en, slug, is_active, sort_order, "order", created_at, updated_at) VALUES
(1, 'Ménage', 'تنظيف', 'Housekeeping', 'menage', true, 0, 0, NOW(), NOW()),
(2, 'Bureaux', 'مكاتب', 'Offices', 'bureaux', true, 0, 0, NOW(), NOW()),
(3, 'Sécurité', 'أمن', 'Security', 'securite', true, 0, 0, NOW(), NOW()),
(4, 'Lavage', 'غسيل', 'Washing', 'lavage', true, 0, 0, NOW(), NOW()),
(5, 'Nettoyage', 'تنظيف', 'Cleaning', 'nettoyage', true, 0, 0, NOW(), NOW()),
(6, 'Standard', 'عادي', 'Standard', 'standard', true, 0, 0, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  slug = EXCLUDED.slug,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  "order" = EXCLUDED."order",
  updated_at = EXCLUDED.updated_at;

-- Re-synchroniser la séquence services_id_seq après les insertions forcées d'ID
SELECT
  setval(
    pg_get_serial_sequence('services', 'id'),
    COALESCE((SELECT MAX(id) + 1 FROM services), 1),
    false
  );

-- إدراج بيانات فئات المنازل (Categories House)
INSERT INTO categories_house (id, service_id, name, name_ar, name_fr, name_en, image, is_active, "order", created_at, updated_at) VALUES
(1, 1, 'Ménage', 'تنظيف', 'Ménage', 'Housekeeping', 'http://127.0.0.1:8000/storage/images/products/939caa82-3dd0-4d4d-bea4-79f41b3fd05d.jpeg', true, 0, '2025-11-01 07:35:30', '2025-11-01 13:15:04'),
(2, 1, 'Cuisine', 'مطبخ', 'Cuisine', 'Kitchen', 'http://127.0.0.1:8000/storage/images/products/3d288de3-fbdc-4215-95cf-8b41054432b7.jpeg', true, 0, '2025-11-01 07:36:02', '2025-11-01 13:14:53'),
(3, 2, 'Bureaux', 'مكاتب', 'Bureaux', 'Offices', 'http://127.0.0.1:8000/storage/images/products/0f6ef38e-ee34-426a-85a5-96298d3bf3ef.jpeg', true, 0, '2025-11-01 07:36:53', '2025-11-01 13:11:37'),
(4, 2, 'Usine', 'مصنع', 'Usine', 'Factory', 'http://127.0.0.1:8000/storage/images/products/c2af690a-2b54-446a-9914-07a056d638c8.jpeg', true, 0, '2025-11-01 07:37:29', '2025-11-01 13:11:25'),
(5, 3, 'Intérieur', 'داخلي', 'Intérieur', 'Interior', 'http://127.0.0.1:8000/storage/images/products/aadbf1f3-b514-4d03-8de4-28ce764f7827.jpeg', true, 0, '2025-11-01 07:38:12', '2025-11-01 13:11:04'),
(6, 3, 'Extérieur', 'خارجي', 'Extérieur', 'Exterior', 'http://127.0.0.1:8000/storage/images/products/86faa0f4-92e2-4fcd-807e-2d695d0c8ed1.jpeg', true, 0, '2025-11-01 07:38:36', '2025-11-01 13:10:54'),
(7, 4, 'Lavage', 'غسيل', 'Lavage', 'Washing', 'http://127.0.0.1:8000/storage/images/products/2d2630dc-3798-4e41-9153-12e9f5b29520.jpeg', true, 0, '2025-11-01 07:39:16', '2025-11-01 13:10:27'),
(8, 4, 'Repassage', 'كيّ', 'Repassage', 'Ironing', 'http://127.0.0.1:8000/storage/images/products/cf3d4dcb-c355-4c1e-bef1-76207f348af0.jpeg', true, 0, '2025-11-01 07:39:56', '2025-11-01 13:10:13'),
(9, 5, 'Nettoyage complet', 'تنظيف شامل', 'Nettoyage complet', 'Deep cleaning', 'http://127.0.0.1:8000/storage/images/products/c1061181-3e04-49cb-8c53-618ad52a1f62.jpeg', true, 0, '2025-11-01 07:40:45', '2025-11-06 07:30:55'),
(10, 5, 'Nettoyage rapide', 'تنظيف سريع', 'Nettoyage rapide', 'Quick cleaning', 'http://127.0.0.1:8000/storage/images/products/7d728672-85cc-4457-a57f-29114e12a3ca.jpeg', true, 0, '2025-11-01 07:41:07', '2025-11-06 07:29:26'),
(11, 6, 'Standard', 'عادي', 'Standard', 'Standard', 'http://127.0.0.1:8000/storage/images/products/91337fb1-e59d-48ca-982e-009a501f486f.jpeg', true, 0, '2025-11-01 07:42:15', '2025-11-01 13:09:11'),
(12, 6, 'Nettoyage profond', 'تنظيف عميق', 'Nettoyage profond', 'Deep Cleaning', 'http://127.0.0.1:8000/storage/images/products/94afffe8-e60f-4387-9396-226ee240ff7a.jpeg', true, 0, '2025-11-01 07:42:39', '2025-11-01 13:08:59'),
(13, 1, 'Ménage + cuisine', 'تنظيف المنزل + الطبخ', 'Ménage + cuisine', 'cleaning + kitchen', 'http://127.0.0.1:8000/storage/images/products/c8eea2e8-3af8-4745-a358-40623d3f04f8.jpeg', true, 0, '2025-11-04 12:15:33', '2025-11-04 12:15:33')
ON CONFLICT (id) DO UPDATE SET
  service_id = EXCLUDED.service_id,
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  image = EXCLUDED.image,
  is_active = EXCLUDED.is_active,
  "order" = EXCLUDED."order",
  updated_at = EXCLUDED.updated_at;

-- Re-synchroniser la séquence categories_house_id_seq après l'insertion
SELECT
  setval(
    pg_get_serial_sequence('categories_house', 'id'),
    COALESCE((SELECT MAX(id) + 1 FROM categories_house), 1),
    false
  );

-- إدراج بيانات أنواع فئات المعرض (Type Category Gallery) - يجب أن تكون قبل category_gallery
INSERT INTO type_category_gallery (id, name, name_ar, name_fr, name_en, "order", created_at, updated_at) VALUES
(1, 'Type 1', 'نوع 1', 'Type 1', 'Type 1', 0, NOW(), NOW()),
(2, 'Type 2', 'نوع 2', 'Type 2', 'Type 2', 0, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  "order" = EXCLUDED."order",
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات فئات المعرض (Category Gallery)
INSERT INTO category_gallery (id, type_category_gallery_id, name_ar, name_fr, name_en, slug, description_ar, description_fr, description_en, is_active, "order", created_at, updated_at) VALUES
(1, 1, 'خدمات التنظيف', 'Ménage', 'house keeping', 'entretien-menager', 'حفظ المنزل', 'entretien menager', 'house keeping', true, 1, '2025-10-29 15:03:45', '2025-11-01 09:57:51'),
(2, 2, 'حماية', 'sécurité', 'security', 'securite', 'حماية', 'sécurité', 'security', true, 1, '2025-10-29 15:04:48', '2025-10-29 15:04:48'),
(3, NULL, 'تنسيق الحدائق', 'Jardinage', 'Gardening', 'jardinage', 'تنسيق الحدائق', 'Jardinage', 'Gardening', true, 3, '2025-11-01 10:06:03', '2025-11-01 10:06:03'),
(4, NULL, 'الأعمال اليدوية', 'Travaux manuels', 'Handwork', 'travaux-manuels', '🛠️ الأعمال اليدوية', 'Travaux manuels', 'Handwork / Manual Work', true, 4, '2025-11-01 10:07:03', '2025-11-01 10:07:03'),
(5, NULL, 'رعاية الأطفال', 'Soins Bébé', 'Child Care', 'soins-bebe', '👶 رعاية الأطفال', 'Soins Bébé', 'Child Care', true, 0, '2025-11-01 10:08:05', '2025-11-01 10:08:05')
ON CONFLICT (id) DO UPDATE SET
  type_category_gallery_id = EXCLUDED.type_category_gallery_id,
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  slug = EXCLUDED.slug,
  description_ar = EXCLUDED.description_ar,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en,
  is_active = EXCLUDED.is_active,
  "order" = EXCLUDED."order",
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات الكفاءات (Competencies)
INSERT INTO competencies (id, name, is_active, created_at, updated_at) VALUES
(1, 'Ménage', true, '2025-10-14 06:23:43', '2025-10-14 06:23:43'),
(2, 'Repassage', true, '2025-10-14 06:23:44', '2025-10-14 06:23:44'),
(3, 'Airbnb', true, '2025-10-14 06:23:44', '2025-10-14 06:23:44'),
(4, 'Piscine', true, '2025-10-14 06:23:44', '2025-10-14 06:23:44'),
(5, 'Bebe Setting', true, '2025-10-23 11:11:05', '2025-10-23 11:11:05'),
(6, 'Jardinage', true, '2025-10-23 11:11:05', '2025-10-23 11:11:05')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات المعرض (Gallery)
INSERT INTO gallery (id, category_gallery_id, image_path, "order", is_active, created_at, updated_at) VALUES
(1, 2, 'gallery/68efc5b6-3b1b-4187-b657-cae7427634c8.jpeg', 1, true, '2025-10-29 15:26:10', '2025-10-29 15:26:10'),
(2, 1, 'gallery/101f1e5b-fb58-4991-89b2-468fc0adca38.jpeg', 2, true, '2025-10-29 15:27:36', '2025-10-29 15:27:36'),
(3, 5, 'gallery/8d8c74cd-07b6-4cc4-9be5-347687e50e5f.jpeg', 3, true, '2025-11-01 10:09:04', '2025-11-01 10:09:04'),
(4, 3, 'gallery/db507578-e92f-458a-8033-187a8e6cddd5.jpeg', 0, true, '2025-11-01 10:09:19', '2025-11-01 10:09:19'),
(5, 4, 'gallery/83d2265a-7069-4a6a-bdd1-e760fa5504d1.jpeg', 0, true, '2025-11-01 10:09:41', '2025-11-01 12:23:37')
ON CONFLICT (id) DO UPDATE SET
  category_gallery_id = EXCLUDED.category_gallery_id,
  image_path = EXCLUDED.image_path,
  "order" = EXCLUDED."order",
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات فئات العمال اليدويين (Hand Worker Categories)
INSERT INTO hand_worker_categories (id, name, slug, description, icon, image, price_per_hour, minimum_hours, is_active, created_at, updated_at, name_ar, name_fr, name_en, description_ar, description_fr, description_en, "order") VALUES
(1, 'Menuisier', 'menuisier', 'Services de menuiserie pour tous vos besoins en bois et construction.', 'fas fa-hammer', NULL, 150.00, 2, true, '2025-10-24 13:27:49', '2025-10-31 07:42:38', 'نجّار 1', 'Menuisier', 'Carpenter', 'خدمات النجارة لتلبية جميع احتياجاتك في الخشب والتصميم.', 'Services de menuiserie pour tous vos besoins en bois et construction.', 'Carpentry services for all your woodwork and design needs.', 0),
(2, 'Plâtrier', 'platrier', 'Services de plâtrerie et finition des murs.', 'fas fa-trowel', NULL, 120.00, 3, true, '2025-10-24 13:27:50', '2025-10-31 07:29:02', 'جبّاص', 'Plâtrier', 'Plasterer', 'خدمات الجبس وإنهاء الجدران بدقة واحترافية.', 'Services de plâtrerie et finition des murs.', 'Plastering and wall finishing services with precision and professionalism.', 0),
(3, 'Peintre', 'peintre', 'Services de peinture intérieure et extérieure.', 'fas fa-paint-brush', NULL, 100.00, 2, true, '2025-10-24 13:27:50', '2025-10-31 07:28:33', 'دهّان', 'Peintre', 'Painter', 'خدمات الطلاء الداخلي والخارجي بجودة عالية.', 'Services de peinture intérieure et extérieure.', 'Interior and exterior painting services with high quality.', 0),
(4, 'Électricien', 'electricien', 'Services électriques pour installations et réparations.', 'fas fa-bolt', NULL, 180.00, 2, true, '2025-10-24 13:27:50', '2025-10-31 07:26:51', 'كهربائي', 'Électricien', 'Electrician', 'خدمات الكهرباء للتركيبات والإصلاحات المنزلية.', 'Services électriques pour installations et réparations.', 'Electrical services for installations and home repairs.', 0),
(5, 'Plombier', 'plombier', 'Services de plomberie pour installations et réparations.', 'fas fa-wrench', NULL, 160.00, 2, true, '2025-10-24 13:27:50', '2025-10-31 07:29:31', 'سبّاك', 'Plombier', 'Plumber', 'خدمات السباكة للتركيب والصيانة بجودة مضمونة.', 'Services de plomberie pour installations et réparations.', 'Plumbing services for installation and maintenance with guaranteed quality.', 0),
(6, 'Carreleur', 'carreleur', 'Pose de carrelage et revêtements de sol.', 'fas fa-th', NULL, 140.00, 7, true, '2025-10-24 13:27:50', '2025-10-30 16:05:17', 'بلاّط', 'Carreleur', 'Tiler', 'خدمات تركيب البلاط وتغطية الأرضيات بدقة.', 'Pose de carrelage et revêtements de sol.', 'Tiling and floor covering services with precision.', 0),
(7, 'Maçon', 'macon', 'Travaux de maçonnerie et construction.', 'fas fa-hard-hat', NULL, 130.00, 4, true, '2025-10-24 13:27:50', '2025-10-31 07:27:29', 'بنّاء', 'Maçon', 'Mason', 'أعمال البناء والإنشاءات بخبرة عالية.', 'Travaux de maçonnerie et construction.', 'Masonry and construction work with high expertise.', 0),
(8, 'Serrurier', 'serrurier', 'Services de serrurerie et sécurité.', 'fas fa-key', NULL, 200.00, 1, true, '2025-10-24 13:27:50', '2025-10-31 07:30:14', 'حدّاد الأقفال', 'Serrurier', 'Locksmith', 'خدمات الأقفال والأمان للمنازل والشركات.', 'Services de serrurerie et sécurité.', 'Locksmith and security services for homes and businesses.', 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  image = EXCLUDED.image,
  price_per_hour = EXCLUDED.price_per_hour,
  minimum_hours = EXCLUDED.minimum_hours,
  is_active = EXCLUDED.is_active,
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  description_ar = EXCLUDED.description_ar,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en,
  "order" = EXCLUDED."order",
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات العمال اليدويين (Hand Workers)
INSERT INTO hand_workers (id, first_name, last_name, email, phone, category_id, photo, status, experience_years, rating, bio, address, city, is_available, created_at, updated_at) VALUES
(1, 'Ahmed', 'Benali', 'ahmed.benali@example.com', '+212612345678', 1, NULL, 'available', 8, 4.8, 'Menuisier expérimenté spécialisé dans la fabrication de meubles sur mesure.', '123 Rue Mohammed V', 'Casablanca', true, '2025-10-24 13:28:02', '2025-10-24 13:28:02'),
(2, 'Mohammed', 'Alami', 'mohammed.alami@example.com', '+212612345679', 1, NULL, 'available', 12, 4.9, 'Maître menuisier avec plus de 12 ans d''expérience dans la construction.', '456 Avenue Hassan II', 'Rabat', true, '2025-10-24 13:28:02', '2025-10-24 13:28:02'),
(3, 'Youssef', 'Tazi', 'youssef.tazi@example.com', '+212612345680', 2, NULL, 'available', 6, 4.6, 'Plâtrier spécialisé dans la finition des murs et plafonds.', '789 Rue de la République', 'Marrakech', true, '2025-10-24 13:28:02', '2025-10-24 13:28:02'),
(4, 'Fatima', 'Bennani', 'fatima.bennani@example.com', '+212612345681', 3, NULL, 'available', 5, 4.7, 'Peintre professionnelle spécialisée dans la décoration intérieure.', '321 Boulevard Zerktouni', 'Casablanca', true, '2025-10-24 13:28:02', '2025-10-24 13:28:02'),
(5, 'Omar', 'Chraibi', 'omar.chraibi@example.com', '+212612345682', 4, NULL, 'available', 10, 4.8, 'Électricien certifié spécialisé dans les installations domestiques et industrielles.', '654 Avenue Mohammed VI', 'Fès', true, '2025-10-24 13:28:02', '2025-10-24 13:28:02'),
(6, 'Hassan', 'Idrissi', 'hassan.idrissi@example.com', '+212612345683', 5, NULL, 'available', 7, 4.5, 'Plombier expérimenté pour installations et réparations.', '987 Rue Ibn Battuta', 'Tanger', true, '2025-10-24 13:28:02', '2025-10-24 13:28:02'),
(7, 'Aicha', 'Mansouri', 'aicha.mansouri@example.com', '+212612345684', 6, NULL, 'available', 9, 4.7, 'Carreleuse spécialisée dans la pose de carrelage et revêtements.', '147 Rue de la Liberté', 'Agadir', true, '2025-10-24 13:28:02', '2025-10-24 13:28:02'),
(8, 'Rachid', 'Berrada', 'rachid.berrada@example.com', '+212612345685', 7, NULL, 'available', 15, 4.9, 'Maître maçon avec plus de 15 ans d''expérience dans la construction.', '258 Avenue des FAR', 'Rabat', true, '2025-10-24 13:28:02', '2025-10-24 13:28:02'),
(9, 'Karim', 'Fassi', 'karim.fassi@example.com', '+212612345686', 8, NULL, 'available', 4, 4.4, 'Serrurier spécialisé dans la sécurité et les systèmes de verrouillage.', '369 Rue de la Paix', 'Casablanca', true, '2025-10-24 13:28:02', '2025-10-24 13:28:02')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category_id = EXCLUDED.category_id,
  photo = EXCLUDED.photo,
  status = EXCLUDED.status,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  bio = EXCLUDED.bio,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  is_available = EXCLUDED.is_available,
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات فئات البستنة (Jardinage Categories)
INSERT INTO jardinage_categories (id, name, name_ar, name_fr, name_en, slug, description, description_ar, description_fr, description_en, image, is_active, "order", created_at, updated_at) VALUES
(1, 'Entretien Jardin', 'صيانة الحديقة', 'Entretien Jardin', 'Garden Maintenance', NULL, 'Services d''entretien régulier pour votre jardin', 'خدمات الصيانة المنتظمة لحديقتك', 'Services d''entretien régulier pour votre jardin', 'Regular maintenance services for your garden', '/images/jardinage/entretien.jpg', true, 0, '2025-10-22 09:04:41', '2025-10-31 10:08:51'),
(2, 'Aménagement Paysager', 'تنسيق الحدائق', 'Aménagement Paysager', 'Landscaping', NULL, 'Création et aménagement d''espaces verts', 'إنشاء وتنسيق المساحات الخضراء', 'Création et aménagement d''espaces verts', 'Creation and arrangement of green spaces', '/images/jardinage/amenagement.jpg', true, 0, '2025-10-22 09:04:42', '2025-10-31 10:02:55'),
(3, 'Plantation', ' 1زراعة', 'Plantation', 'Plantation', NULL, 'Plantation d''arbres, arbustes et fleurs', 'زراعة الأشجار والشجيرات والزهور', 'Plantation d''arbres, arbustes et fleurs', 'Planting trees, shrubs, and flowers', '/images/jardinage/plantation.jpg', true, 0, '2025-10-22 09:04:42', '2025-10-31 10:05:11'),
(4, 'Tonte et Taille', 'جز وتقليم', 'Tonte et Taille', 'Mowing and Pruning', NULL, 'Services de tonte de gazon et taille de végétaux', 'خدمات جز العشب وتقليم النباتات', 'Services de tonte de gazon et taille de végétaux', 'Lawn mowing and plant pruning services', '/images/jardinage/tonte.jpg', true, 0, '2025-10-22 09:04:42', '2025-10-31 10:08:19')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en,
  image = EXCLUDED.image,
  is_active = EXCLUDED.is_active,
  "order" = EXCLUDED."order",
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات أنواع المنتجات (Product Types) - يجب أن تكون قبل products
INSERT INTO product_types (id, category_id, name, name_ar, name_fr, name_en, slug, description, description_ar, description_fr, description_en, is_active, "order", created_at, updated_at) VALUES
(1, 1, 'Séparateur mobile', 'فاصل متنقل', 'Séparateur mobile', 'Mobile separator', 'separateur-mobile', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:07:30', '2025-10-13 11:07:30'),
(2, 1, 'Robot mobile', 'روبوت متنقل', 'Robot mobile', 'Robot mobile', 'robot-mobile', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:07:30', '2025-10-13 11:07:30'),
(3, 1, 'Robot de piscine', 'روبوت حمام السباحة', 'Robot de piscine', 'Pool robot', 'robot-de-piscine', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:07:30', '2025-10-13 11:07:30'),
(4, 1, 'les mops', 'الممسحات', 'les mops', 'the mops', 'les-mops', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:07:31', '2025-10-13 11:07:31'),
(5, 1, 'Un tuyau', 'أنبوب', 'Un tuyau', 'tube', 'un-tuyau', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:07:31', '2025-10-13 11:07:31'),
(6, 1, 'Les pompes de jardin', 'مضخات الحدائق', 'Les pompes de jardin', 'Garden pumps', 'les-pompes-de-jardin', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:07:31', '2025-10-13 11:07:31'),
(7, 1, 'Les nappes  de nettoyage', 'مناديل التنظيف', 'Les nappes  de nettoyage', 'Cleaning cloths', 'les-nappes-de-nettoyage', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:07:31', '2025-10-13 11:07:31'),
(8, 1, 'Les vêtements de nettoyage', 'تنظيف الملابس', 'Les vêtements de nettoyage', 'Cleaning clothes', 'les-vetements-de-nettoyage', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:07:31', '2025-10-13 11:07:31'),
(9, 1, 'Linges', 'بياضات', 'Linges', 'Linges', 'linges', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:07:31', '2025-10-13 11:07:31'),
(10, 1, 'Les masques', 'الأقنعة', 'Les masques', 'The masks', 'les-masques', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:07:31', '2025-10-13 11:07:31'),
(11, 1, 'Désinfecteur', 'مطهر', 'Désinfecteur', 'Disinfectant', 'desinfecteur', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:07:31', '2025-10-13 11:07:31'),
(12, 2, 'Marbre', 'رخام', 'Marbre', 'Marbre', 'marbre', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:47:55', '2025-10-13 11:47:55'),
(13, 2, 'Carrelage Fès', 'بلاط في فاس', 'Carrelage Fès', 'Tiles in Fez', 'carrelage-fes', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:47:55', '2025-10-13 11:47:55'),
(14, 2, 'Bois', 'Bois', 'Bois', 'Bois', 'bois', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:47:55', '2025-10-13 11:47:55'),
(15, 2, 'Insecticide', 'مبيد حشري', 'Insecticide', 'Insecticide', 'insecticide', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:47:55', '2025-10-13 11:47:55'),
(16, 2, 'Vetrine', 'واجهات المتاجر', 'Vetrine', 'Vitrines de magasins', 'vetrine', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:47:55', '2025-10-13 11:47:55'),
(17, 2, 'Parfum d''intérieur', 'عطر منزلي', 'Parfum d''intérieur', 'Home fragrance', 'parfum-dinterieur', NULL, NULL, NULL, NULL, true, 0, '2025-10-13 11:47:55', '2025-10-13 11:47:55')
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en,
  is_active = EXCLUDED.is_active,
  "order" = EXCLUDED."order",
  updated_at = EXCLUDED.updated_at;

-- إدراج بيانات المنتجات (Products)
INSERT INTO products (id, name, name_ar, name_fr, name_en, slug, description, description_ar, description_fr, description_en, price, image, category_id, type_id, in_stock, stock_quantity, "order", created_at, updated_at) VALUES
(25, 'Produit de Nettoyage Premium', 'منتج تنظيف فاخر 1', 'Produit de Nettoyage Premium', 'Premium Cleaning Product', NULL, 'Produit de nettoyage haute qualité pour tous types de surfaces', 'منتج تنظيف عالي الجودة لجميع أنواع الأسطح', 'Produit de nettoyage haute qualité pour tous types de surfaces', 'High-quality cleaning product for all types of surfaces', 25.99, 'http://127.0.0.1:8000/storage/images/products/9bb3ba0a-1f3b-4612-81ed-5ee8e9a11263.jpg', 1, 8, true, 50, 0, '2025-10-17 13:06:41', '2025-10-30 13:47:32'),
(26, 'Détergent Multi-Surfaces', 'منظف ​​متعدد الأسطح', 'Détergent Multi-Surfaces', 'Multi-Surface Detergent', NULL, 'Détergent efficace pour cuisine, salle de bain et autres surfaces', 'منظف فعال للمطابخ والحمامات والأسطح الأخرى', 'Détergent efficace pour cuisine, salle de bain et autres surfaces', 'Effective detergent for kitchens, bathrooms, and other surfaces', 18.50, 'http://127.0.0.1:8000/storage/images/products/c0799774-07ac-4405-92f1-59a137bd8a37.jpg', 1, 6, true, 30, 0, '2025-10-17 13:06:41', '2025-10-30 13:49:06'),
(27, 'Nettoyant Vitres Professionnel', 'منظف ​​نوافذ احترافي', 'Nettoyant Vitres Professionnel', 'Professional Window Cleaner', NULL, 'Nettoyant pour vitres sans traces, formule professionnelle', 'منظف نوافذ بدون خطوط، تركيبة احترافية', 'Nettoyant pour vitres sans traces, formule professionnelle', 'Streak-free window cleaner, professional formula', 12.75, 'http://127.0.0.1:8000/storage/images/products/f5244b99-6912-40c7-bba0-9b5405aaed50.jpg', 2, 13, true, 25, 0, '2025-10-17 13:06:41', '2025-10-30 13:50:21'),
(30, 'Cire pour Sols', 'شمع الأرضيات', 'Cire pour Sols', 'Cire pour Sols', NULL, 'Cire protectrice pour sols en bois et stratifiés', 'شمع واقي للأرضيات الخشبية والخشبية', 'Cire protectrice pour sols en bois et stratifiés', 'Cire protectrice pour sols en bois et stratifiés', 40.00, 'http://127.0.0.1:8000/storage/images/products/0800e4c0-9b3a-4374-a5b8-13ddfcd7e612.jpg', 2, 17, true, 15, 0, '2025-10-17 13:07:24', '2025-10-30 13:44:51'),
(31, 'Crystal Glass Cleaner', 'منظف ​​زجاج كريستالي', 'Nettoyant pour vitres Crystal', 'Crystal Glass Cleaner', NULL, 'Solution transparente pour vitres et miroirs. Fait briller sans laisser de traces ni de film. Idéal pour les fenêtres, miroirs et écrans.', 'محلول شفاف للزجاج والمرايا. يترك لمعانًا لامعًا دون أي آثار أو غشاوة. مثالي للنوافذ والمرايا والشاشات.', 'Solution transparente pour le verre et les miroirs. Laisse une brillance éclatante sans traces ni voile. Idéal pour les fenêtres, les miroirs et les écrans.', 'A clear solution for glass and mirrors. Leaves a brilliant shine without any streaks or haze. Ideal for windows, mirrors, and screens.', 234.00, 'http://127.0.0.1:8000/storage/images/products/60b67e83-9c48-4644-9635-dc024a6fed72.jpg', 2, 12, true, 32, 0, '2025-10-18 09:17:24', '2025-10-30 13:41:49'),
(32, 'Sparkle Détergent Multi-Usages', 'منظف ​​سباركل متعدد الاستخدامات', 'Sparkle Détergent Multi-Usages', 'Sparkle Multi-Purpose Detergent', NULL, 'Nettoyant puissant pour toutes les surfaces, élimine la saleté, la graisse et les traces tenaces sans rayer. Parfum frais et durable.', 'منظف قوي لجميع الأسطح، يزيل الأوساخ والشحوم والبقع الصعبة دون خدش. برائحة منعشة تدوم طويلًا.', 'Nettoyant puissant pour toutes les surfaces, élimine la saleté, la graisse et les traces tenaces sans rayer. Parfum frais et durable.', 'Powerful cleaner for all surfaces, removes dirt, grease and tough stains without scratching. Fresh and long-lasting fragrance.', 24.00, 'http://127.0.0.1:8000/storage/images/products/ecb2bb5d-3bc7-4dac-9026-c178450173d0.jpg', 2, 3, true, 34, 0, '2025-10-18 09:55:55', '2025-10-30 13:46:02')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en,
  price = EXCLUDED.price,
  image = EXCLUDED.image,
  category_id = EXCLUDED.category_id,
  type_id = EXCLUDED.type_id,
  in_stock = EXCLUDED.in_stock,
  stock_quantity = EXCLUDED.stock_quantity,
  "order" = EXCLUDED."order",
  updated_at = EXCLUDED.updated_at;

-- ============================================
-- إضافة حقول مفقودة للجداول الموجودة
-- ============================================

-- إضافة حقل metadata إلى جدول employees (إذا لم يكن موجوداً)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- تم الانتهاء!
-- ============================================
-- الآن يمكنك:
-- 1. استيراد البيانات من MySQL
-- 2. اختبار الـ CRUD operations
-- 3. إعداد Authentication في Supabase Dashboard
-- 4. إذا كان جدول employees موجوداً مسبقاً، نفذ أمر ALTER TABLE أعلاه

