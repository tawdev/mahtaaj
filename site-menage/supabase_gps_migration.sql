-- Migration Supabase: Ajout du système de localisation GPS (Version Simplifiée)
-- Date: 2026-01-29
-- Description: Ajout des colonnes GPS sans dépendances sur le schéma existant

-- ============================================
-- 1. Ajouter les colonnes de localisation GPS
-- ============================================

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_address TEXT,
ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_country VARCHAR(100) DEFAULT 'Maroc',
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP DEFAULT NOW();

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN employees.latitude IS 'Latitude GPS de la zone d''intervention de l''employé';
COMMENT ON COLUMN employees.longitude IS 'Longitude GPS de la zone d''intervention de l''employé';
COMMENT ON COLUMN employees.location_address IS 'Adresse formatée obtenue par géocodage inverse';

-- ============================================
-- 2. Activer PostGIS et créer index spatial
-- ============================================

-- Activer l'extension PostGIS si pas déjà fait
CREATE EXTENSION IF NOT EXISTS postgis;

-- Créer un index spatial pour les recherches de proximité
CREATE INDEX IF NOT EXISTS idx_employees_location 
ON employees USING gist (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================
-- 3. Fonction de recherche par proximité (Version Générique)
-- ============================================

CREATE OR REPLACE FUNCTION find_employees_nearby(
  search_lat DECIMAL,
  search_lng DECIMAL,
  radius_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  latitude DECIMAL,
  longitude DECIMAL,
  location_address TEXT,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.latitude,
    e.longitude,
    e.location_address,
    ROUND(
      ST_Distance(
        ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
      ) / 1000, 2
    ) AS distance_km
  FROM employees e
  WHERE e.latitude IS NOT NULL 
    AND e.longitude IS NOT NULL
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Exemple d'utilisation:
-- SELECT * FROM find_employees_nearby(31.7917, -7.0926, 10);

-- ============================================
-- 4. Trigger pour mettre à jour location_updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.latitude IS DISTINCT FROM OLD.latitude) OR 
     (NEW.longitude IS DISTINCT FROM OLD.longitude) THEN
    NEW.location_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_location_timestamp ON employees;
CREATE TRIGGER trigger_update_location_timestamp
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_location_timestamp();

-- ============================================
-- 5. Fonction de validation des coordonnées
-- ============================================

CREATE OR REPLACE FUNCTION validate_coordinates()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que les coordonnées sont valides
  IF NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90) THEN
    RAISE EXCEPTION 'Latitude invalide: doit être entre -90 et 90';
  END IF;
  
  IF NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180) THEN
    RAISE EXCEPTION 'Longitude invalide: doit être entre -180 et 180';
  END IF;
  
  -- Vérifier que si latitude est définie, longitude l'est aussi (et vice-versa)
  IF (NEW.latitude IS NOT NULL AND NEW.longitude IS NULL) OR 
     (NEW.latitude IS NULL AND NEW.longitude IS NOT NULL) THEN
    RAISE EXCEPTION 'Latitude et longitude doivent être définies ensemble';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_coordinates ON employees;
CREATE TRIGGER trigger_validate_coordinates
BEFORE INSERT OR UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION validate_coordinates();

-- ============================================
-- 6. Fonctions utilitaires
-- ============================================

-- Calculer la distance entre deux points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lng1 DECIMAL,
  lat2 DECIMAL,
  lng2 DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(
    ST_Distance(
      ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
      ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
    ) / 1000, 2
  );
END;
$$ LANGUAGE plpgsql;

-- Vérifier si un point est au Maroc (approximatif)
CREATE OR REPLACE FUNCTION is_in_morocco(
  lat DECIMAL,
  lng DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    lat >= 21.0 AND lat <= 36.0 AND
    lng >= -17.5 AND lng <= -1.0
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Indexes supplémentaires pour performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employees_location_updated 
ON employees(location_updated_at DESC)
WHERE latitude IS NOT NULL;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND column_name IN ('latitude', 'longitude', 'location_address', 'location_city', 'location_country', 'location_updated_at')
ORDER BY column_name;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================

-- ✅ Ce script est maintenant compatible avec n'importe quel schéma employees
-- ✅ Il ajoute uniquement les colonnes GPS nécessaires
-- ✅ Les fonctions de recherche sont génériques
-- ✅ Les triggers de validation sont actifs
-- ✅ PostGIS est activé pour les recherches spatiales

-- Pour personnaliser la fonction find_employees_nearby avec vos colonnes:
-- Modifiez la fonction pour inclure les colonnes spécifiques de votre table
-- Par exemple, si vous avez une colonne 'full_name' au lieu de 'name':
/*
CREATE OR REPLACE FUNCTION find_employees_nearby(
  search_lat DECIMAL,
  search_lng DECIMAL,
  radius_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  full_name VARCHAR,  -- Votre colonne
  latitude DECIMAL,
  longitude DECIMAL,
  location_address TEXT,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.full_name,  -- Votre colonne
    e.latitude,
    e.longitude,
    e.location_address,
    ROUND(
      ST_Distance(
        ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
      ) / 1000, 2
    ) AS distance_km
  FROM employees e
  WHERE e.latitude IS NOT NULL 
    AND e.longitude IS NOT NULL
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;
*/
