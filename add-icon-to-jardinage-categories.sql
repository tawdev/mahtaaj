-- ============================================
-- Ajouter la colonne icon à la table jardinage_categories
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor
-- ============================================

-- Vérifier si la colonne icon existe déjà
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'jardinage_categories'
  AND column_name = 'icon';

-- Ajouter la colonne icon si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jardinage_categories' 
      AND column_name = 'icon'
  ) THEN
    ALTER TABLE jardinage_categories ADD COLUMN icon TEXT;
    RAISE NOTICE 'Colonne icon ajoutée à jardinage_categories';
  ELSE
    RAISE NOTICE 'Colonne icon existe déjà';
  END IF;
END $$;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'jardinage_categories'
  ORDER BY ordinal_position;

