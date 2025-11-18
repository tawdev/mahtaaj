-- ============================================
-- إضافة colonne jardinage_category_id إلى جدول jardinage_reservations
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor si la table existe déjà
-- ============================================

-- Vérifier si la colonne existe déjà
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'jardinage_reservations'
  AND column_name = 'jardinage_category_id';

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
    
    RAISE NOTICE 'Colonne jardinage_category_id ajoutée à jardinage_reservations';
  ELSE
    RAISE NOTICE 'Colonne jardinage_category_id existe déjà';
  END IF;
END $$;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_jardinage_reservations_category_id 
ON jardinage_reservations(jardinage_category_id);

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'jardinage_reservations'
  ORDER BY ordinal_position;

