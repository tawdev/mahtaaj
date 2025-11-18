-- ============================================
-- Vérifier et corriger les politiques RLS pour jardinage_categories
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor pour permettre les mises à jour d'images
-- ============================================

-- Vérifier si RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'jardinage_categories';

-- Vérifier les politiques existantes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'jardinage_categories';

-- Vérifier que la colonne image existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'jardinage_categories'
  AND column_name = 'image';

-- Si la colonne image n'existe pas, l'ajouter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jardinage_categories' 
      AND column_name = 'image'
  ) THEN
    ALTER TABLE jardinage_categories ADD COLUMN image TEXT;
    RAISE NOTICE 'Colonne image ajoutée à jardinage_categories';
  ELSE
    RAISE NOTICE 'Colonne image existe déjà';
  END IF;
END $$;

-- Option 1: Désactiver RLS (si vous n'avez pas besoin de RLS pour cette table)
-- ALTER TABLE jardinage_categories DISABLE ROW LEVEL SECURITY;

-- Option 2: Créer des politiques permissives pour permettre tous les updates (pour les admins)
-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow all updates on jardinage_categories" ON jardinage_categories;
DROP POLICY IF EXISTS "Allow admin updates on jardinage_categories" ON jardinage_categories;
DROP POLICY IF EXISTS "Allow all inserts on jardinage_categories" ON jardinage_categories;
DROP POLICY IF EXISTS "Allow all selects on jardinage_categories" ON jardinage_categories;
DROP POLICY IF EXISTS "Allow all deletes on jardinage_categories" ON jardinage_categories;

-- Créer une politique permissive pour UPDATE (permet à tous de mettre à jour)
-- ATTENTION: Ceci permet à n'importe qui de mettre à jour. Ajustez selon vos besoins de sécurité.
CREATE POLICY "Allow all updates on jardinage_categories"
  ON jardinage_categories
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Créer une politique permissive pour INSERT
CREATE POLICY "Allow all inserts on jardinage_categories"
  ON jardinage_categories
  FOR INSERT
  WITH CHECK (true);

-- Créer une politique permissive pour SELECT
CREATE POLICY "Allow all selects on jardinage_categories"
  ON jardinage_categories
  FOR SELECT
  USING (true);

-- Créer une politique permissive pour DELETE
CREATE POLICY "Allow all deletes on jardinage_categories"
  ON jardinage_categories
  FOR DELETE
  USING (true);

-- Vérifier que les politiques ont été créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'jardinage_categories';

-- Vérifier que RLS est activé
ALTER TABLE jardinage_categories ENABLE ROW LEVEL SECURITY;

