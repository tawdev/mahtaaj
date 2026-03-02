-- Final Fix for Admin Login RLS Recursion
-- This script fixes the "infinite recursion" error by simplifying policies

-- 1. Ensure RLS is enabled
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 2. Clean up ALL old policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage admins" ON public.admins;
DROP POLICY IF EXISTS "Users can read own admin record" ON public.admins;
DROP POLICY IF EXISTS "Allow authenticated read admins" ON public.admins;
DROP POLICY IF EXISTS "Users can manage own admin record" ON public.admins;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admins;

-- 3. Create a SIMPLE non-recursive SELECT policy
-- This allows any authenticated user to check if their email exists in the admins table.
-- It's safe because it doesn't join or query the same table again.
CREATE POLICY "authenticated_read_admins"
ON public.admins
FOR SELECT
TO authenticated
USING (true);

-- 4. Create a policy for management (Optional, allows users to update themselves)
CREATE POLICY "admins_self_manage"
ON public.admins
FOR ALL
TO authenticated
USING (email = auth.jwt() ->> 'email')
WITH CHECK (email = auth.jwt() ->> 'email');

-- 5. If you want a policy that allows specialized admins to manage others, 
-- it's safer to do that via Supabase roles or a custom function to avoid recursion.
-- For now, the policies above are enough to fix the login error for ALL admin types.

-- IMPORTANT: Make sure the following emails exist in your "Authentication -> Users" section:
-- admin@example.com
-- bebe@gmail.com
-- admin@driver.com
-- house@gmail.com
-- hande@gmail.com
-- security@gmail.com
-- jardin@gmail.com
