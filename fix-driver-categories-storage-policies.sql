-- ============================================
-- Fix Storage Policies for Driver Categories Image Uploads
-- ============================================
-- This script sets up RLS policies for the 'employees' bucket
-- to allow authenticated users and admins to upload images

-- ============================================
-- 1. إنشاء Bucket إذا لم يكن موجوداً
-- ============================================
-- Note: Buckets must be created manually in Supabase Dashboard
-- Go to Storage > Create Bucket > Name: "employees" > Public: true

-- ============================================
-- 2. حذف Policies القديمة (اختياري)
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to employees bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to employees bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role to upload to employees bucket" ON storage.objects;

-- ============================================
-- 3. إنشاء Policies للرفع (INSERT)
-- ============================================

-- Policy 1: السماح للمستخدمين المصادق عليهم برفع الصور
CREATE POLICY "Allow authenticated uploads to employees bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employees' 
  AND (storage.foldername(name))[1] IS NULL -- Allow uploads to root
);

-- Policy 2: السماح للخدمة (service role) برفع الصور (للإدارة)
-- Note: Service role bypasses RLS, but this policy is for explicit permission
CREATE POLICY "Allow service role uploads to employees bucket"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (
  bucket_id = 'employees'
);

-- ============================================
-- 4. إنشاء Policies للقراءة (SELECT)
-- ============================================

-- Policy 3: السماح للجميع بقراءة الصور (public read)
CREATE POLICY "Allow public reads from employees bucket"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'employees'
);

-- ============================================
-- 5. إنشاء Policies للتحديث (UPDATE)
-- ============================================

-- Policy 4: السماح للمستخدمين المصادق عليهم بتحديث الصور
CREATE POLICY "Allow authenticated updates to employees bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employees'
)
WITH CHECK (
  bucket_id = 'employees'
);

-- ============================================
-- 6. إنشاء Policies للحذف (DELETE)
-- ============================================

-- Policy 5: السماح للمستخدمين المصادق عليهم بحذف الصور
CREATE POLICY "Allow authenticated deletes from employees bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'employees'
);

-- ============================================
-- 7. التحقق من Policies
-- ============================================
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%employees%'
ORDER BY policyname;

-- ============================================
-- ملاحظات مهمة:
-- ============================================
-- 1. تأكد من أن bucket "employees" موجود و public في Supabase Dashboard
-- 2. إذا استمر الخطأ 401، تأكد من:
--    - إضافة REACT_APP_SUPABASE_SERVICE_ROLE_KEY في ملف .env
--    - إعادة تشغيل التطبيق بعد إضافة المتغير
-- 3. يمكنك أيضاً تعطيل RLS مؤقتاً للاختبار:
--    ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
--    (غير موصى به للإنتاج)

