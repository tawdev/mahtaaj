-- ============================================
-- إضافة الأعمدة المفقودة إلى جدول jardinage_reservations
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor pour ajouter toutes les colonnes manquantes
-- ============================================

-- Ajouter booking_type si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jardinage_reservations' 
      AND column_name = 'booking_type'
  ) THEN
    ALTER TABLE jardinage_reservations 
    ADD COLUMN booking_type TEXT NOT NULL DEFAULT 'heures';
    
    ALTER TABLE jardinage_reservations 
    ADD CONSTRAINT jardinage_reservations_booking_type_check 
    CHECK (booking_type IN ('heures', 'jours'));
    
    RAISE NOTICE 'Colonne booking_type ajoutée';
  ELSE
    RAISE NOTICE 'Colonne booking_type existe déjà';
  END IF;
END $$;

-- Ajouter days si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jardinage_reservations' 
      AND column_name = 'days'
  ) THEN
    ALTER TABLE jardinage_reservations 
    ADD COLUMN days INTEGER;
    
    RAISE NOTICE 'Colonne days ajoutée';
  ELSE
    RAISE NOTICE 'Colonne days existe déjà';
  END IF;
END $$;

-- Ajouter hours si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jardinage_reservations' 
      AND column_name = 'hours'
  ) THEN
    ALTER TABLE jardinage_reservations 
    ADD COLUMN hours INTEGER;
    
    RAISE NOTICE 'Colonne hours ajoutée';
  ELSE
    RAISE NOTICE 'Colonne hours existe déjà';
  END IF;
END $$;

-- Ajouter start_date si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jardinage_reservations' 
      AND column_name = 'start_date'
  ) THEN
    ALTER TABLE jardinage_reservations 
    ADD COLUMN start_date DATE;
    
    RAISE NOTICE 'Colonne start_date ajoutée';
  ELSE
    RAISE NOTICE 'Colonne start_date existe déjà';
  END IF;
END $$;

-- Ajouter start_time si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jardinage_reservations' 
      AND column_name = 'start_time'
  ) THEN
    ALTER TABLE jardinage_reservations 
    ADD COLUMN start_time TIME;
    
    RAISE NOTICE 'Colonne start_time ajoutée';
  ELSE
    RAISE NOTICE 'Colonne start_time existe déjà';
  END IF;
END $$;

-- Ajouter start_date_jours si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jardinage_reservations' 
      AND column_name = 'start_date_jours'
  ) THEN
    ALTER TABLE jardinage_reservations 
    ADD COLUMN start_date_jours DATE;
    
    RAISE NOTICE 'Colonne start_date_jours ajoutée';
  ELSE
    RAISE NOTICE 'Colonne start_date_jours existe déjà';
  END IF;
END $$;

-- Ajouter end_date_jours si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jardinage_reservations' 
      AND column_name = 'end_date_jours'
  ) THEN
    ALTER TABLE jardinage_reservations 
    ADD COLUMN end_date_jours DATE;
    
    RAISE NOTICE 'Colonne end_date_jours ajoutée';
  ELSE
    RAISE NOTICE 'Colonne end_date_jours existe déjà';
  END IF;
END $$;

-- Ajouter location si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jardinage_reservations' 
      AND column_name = 'location'
  ) THEN
    ALTER TABLE jardinage_reservations 
    ADD COLUMN location TEXT NOT NULL DEFAULT 'Non spécifié';
    
    RAISE NOTICE 'Colonne location ajoutée';
  ELSE
    RAISE NOTICE 'Colonne location existe déjà';
  END IF;
END $$;

-- Vérifier toutes les colonnes de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'jardinage_reservations'
  ORDER BY ordinal_position;

