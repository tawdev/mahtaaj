-- ============================================
-- إضافة colonne booking_type إلى جدول jardinage_reservations
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor si la colonne booking_type est manquante
-- ============================================

-- Vérifier si la colonne booking_type existe déjà
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'jardinage_reservations'
  AND column_name = 'booking_type';

-- Ajouter la colonne booking_type si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jardinage_reservations' 
      AND column_name = 'booking_type'
  ) THEN
    -- Ajouter la colonne booking_type
    ALTER TABLE jardinage_reservations 
    ADD COLUMN booking_type TEXT NOT NULL DEFAULT 'heures';
    
    -- Ajouter la contrainte CHECK
    ALTER TABLE jardinage_reservations 
    ADD CONSTRAINT jardinage_reservations_booking_type_check 
    CHECK (booking_type IN ('heures', 'jours'));
    
    RAISE NOTICE 'Colonne booking_type ajoutée à jardinage_reservations';
  ELSE
    RAISE NOTICE 'Colonne booking_type existe déjà';
  END IF;
END $$;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'jardinage_reservations'
  AND column_name = 'booking_type';

-- Vérifier toutes les colonnes de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'jardinage_reservations'
  ORDER BY ordinal_position;

