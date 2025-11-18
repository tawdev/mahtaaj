-- ============================================
-- Ajouter les colonnes manquantes à la table reserve_security
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor
-- ============================================

-- Ajouter les colonnes si elles n'existent pas déjà
-- D'abord, ajouter la colonne type_reservation si elle n'existe pas
ALTER TABLE reserve_security 
ADD COLUMN IF NOT EXISTS type_reservation TEXT;

-- Mettre à jour toutes les valeurs invalides existantes (les mettre à NULL ou une valeur valide)
UPDATE reserve_security 
SET type_reservation = NULL 
WHERE type_reservation IS NOT NULL 
AND type_reservation NOT IN ('heures', 'jours');

-- Supprimer l'ancienne contrainte si elle existe
ALTER TABLE reserve_security 
DROP CONSTRAINT IF EXISTS reserve_security_type_reservation_check;

-- Ajouter la nouvelle contrainte CHECK (qui permet NULL ou 'heures'/'jours')
ALTER TABLE reserve_security 
ADD CONSTRAINT reserve_security_type_reservation_check 
CHECK (type_reservation IS NULL OR type_reservation IN ('heures', 'jours'));

ALTER TABLE reserve_security 
ADD COLUMN IF NOT EXISTS date_reservation DATE;

ALTER TABLE reserve_security 
ADD COLUMN IF NOT EXISTS heure_debut TIME;

ALTER TABLE reserve_security 
ADD COLUMN IF NOT EXISTS heure_fin TIME;

ALTER TABLE reserve_security 
ADD COLUMN IF NOT EXISTS date_debut DATE;

ALTER TABLE reserve_security 
ADD COLUMN IF NOT EXISTS date_fin DATE;

ALTER TABLE reserve_security 
ADD COLUMN IF NOT EXISTS nombre_heures INTEGER;

ALTER TABLE reserve_security 
ADD COLUMN IF NOT EXISTS role_id BIGINT REFERENCES security_roles(id) ON DELETE SET NULL;

-- Ajouter des commentaires sur les colonnes
COMMENT ON COLUMN reserve_security.type_reservation IS 'Type de réservation: heures ou jours';
COMMENT ON COLUMN reserve_security.date_reservation IS 'Date de la réservation (pour réservation par heures)';
COMMENT ON COLUMN reserve_security.heure_debut IS 'Heure de début (pour réservation par heures)';
COMMENT ON COLUMN reserve_security.heure_fin IS 'Heure de fin (pour réservation par heures)';
COMMENT ON COLUMN reserve_security.date_debut IS 'Date de début (pour réservation par jours)';
COMMENT ON COLUMN reserve_security.date_fin IS 'Date de fin (pour réservation par jours)';
COMMENT ON COLUMN reserve_security.nombre_heures IS 'Nombre d''heures (pour réservation par heures)';
COMMENT ON COLUMN reserve_security.role_id IS 'ID du rôle de sécurité sélectionné';

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reserve_security' 
AND column_name IN ('type_reservation', 'date_reservation', 'heure_debut', 'heure_fin', 'date_debut', 'date_fin', 'nombre_heures', 'role_id')
ORDER BY column_name;

