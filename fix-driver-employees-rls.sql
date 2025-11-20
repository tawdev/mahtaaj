-- ============================================
-- إصلاح RLS Policies لجدول driver_employees
-- ============================================
-- هذا الملف يضيف policy للسماح للجميع بإدراج البيانات في driver_employees
-- انسخ هذا الكود والصقه في Supabase SQL Editor
-- ============================================

-- حذف Policy القديم الذي يمنع الإدراج من قبل المستخدمين غير المسجلين
DROP POLICY IF EXISTS "Admins can manage driver employees" ON driver_employees;

-- Policy للسماح للجميع بإدراج البيانات (للتسجيل)
CREATE POLICY "Anyone can insert driver employees"
ON driver_employees FOR INSERT
TO public
WITH CHECK (true);

-- Policy للسماح للمسؤولين فقط بتحديث وحذف السائقين
CREATE POLICY "Admins can update driver employees"
ON driver_employees FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND admins.is_active = true
  )
);

CREATE POLICY "Admins can delete driver employees"
ON driver_employees FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND admins.is_active = true
  )
);

-- التحقق من Policies الحالية
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'driver_employees'
ORDER BY policyname;

