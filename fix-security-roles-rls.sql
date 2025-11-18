-- ============================================
-- Vérifier et corriger les politiques RLS pour security_roles
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor si l'image n'est pas sauvegardée
-- ============================================

-- Vérifier si RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'security_roles';

-- Vérifier les politiques existantes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'security_roles';

-- Si RLS est activé mais qu'il n'y a pas de politique UPDATE, créer une politique permissive
-- D'abord, désactiver RLS temporairement pour permettre les updates (si nécessaire)
-- OU créer une politique qui permet les updates

-- Option 1: Désactiver RLS (si vous n'avez pas besoin de RLS pour cette table)
-- ALTER TABLE security_roles DISABLE ROW LEVEL SECURITY;

-- Option 2: Créer une politique permissive pour permettre tous les updates (pour les admins)
-- Supprimer les anciennes politiques UPDATE si elles existent
DROP POLICY IF EXISTS "Allow all updates on security_roles" ON security_roles;
DROP POLICY IF EXISTS "Allow admin updates on security_roles" ON security_roles;

-- Créer une politique permissive pour UPDATE (permet à tous de mettre à jour)
-- ATTENTION: Ceci permet à n'importe qui de mettre à jour. Ajustez selon vos besoins de sécurité.
CREATE POLICY "Allow all updates on security_roles"
  ON security_roles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Créer une politique permissive pour INSERT
DROP POLICY IF EXISTS "Allow all inserts on security_roles" ON security_roles;
CREATE POLICY "Allow all inserts on security_roles"
  ON security_roles
  FOR INSERT
  WITH CHECK (true);

-- Créer une politique permissive pour SELECT
DROP POLICY IF EXISTS "Allow all selects on security_roles" ON security_roles;
CREATE POLICY "Allow all selects on security_roles"
  ON security_roles
  FOR SELECT
  USING (true);

-- Vérifier que les politiques ont été créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'security_roles';

