-- ============================================
-- Update driver_reservation table to add new fields
-- ============================================
-- This script adds fields for full_name, email, phone, time, and message

-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add full_name column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_reservation' AND column_name = 'full_name') THEN
    ALTER TABLE driver_reservation ADD COLUMN full_name TEXT;
  END IF;

  -- Add email column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_reservation' AND column_name = 'email') THEN
    ALTER TABLE driver_reservation ADD COLUMN email TEXT;
  END IF;

  -- Add phone column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_reservation' AND column_name = 'phone') THEN
    ALTER TABLE driver_reservation ADD COLUMN phone TEXT;
  END IF;

  -- Add reservation_time column (time of day)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_reservation' AND column_name = 'reservation_time') THEN
    ALTER TABLE driver_reservation ADD COLUMN reservation_time TIME;
  END IF;

  -- Add address column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_reservation' AND column_name = 'address') THEN
    ALTER TABLE driver_reservation ADD COLUMN address TEXT;
  END IF;

  -- Add message column (Additional Message)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_reservation' AND column_name = 'message') THEN
    ALTER TABLE driver_reservation ADD COLUMN message TEXT;
  END IF;

  RAISE NOTICE 'Les colonnes ont été ajoutées avec succès à la table driver_reservation';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de l''ajout des colonnes: %', SQLERRM;
END $$;

-- Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'driver_reservation'
ORDER BY ordinal_position;

-- Add comments to columns for documentation
COMMENT ON COLUMN driver_reservation.full_name IS 'Nom complet du client';
COMMENT ON COLUMN driver_reservation.email IS 'Email du client';
COMMENT ON COLUMN driver_reservation.phone IS 'Numéro de téléphone du client';
COMMENT ON COLUMN driver_reservation.reservation_time IS 'Heure de la réservation';
COMMENT ON COLUMN driver_reservation.address IS 'Adresse du client';
COMMENT ON COLUMN driver_reservation.message IS 'Message supplémentaire du client';

