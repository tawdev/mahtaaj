-- Migration Supabase: Ajout du système de localisation GPS à TOUTES les tables d'employés
-- Date: 2026-01-30

-- 1. Activer l'extension PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Fonction pour ajouter les colonnes GPS à une table
CREATE OR REPLACE FUNCTION add_gps_columns_to_table(table_name TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8)', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8)', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS location_address TEXT', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS location_city VARCHAR(100)', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS location_country VARCHAR(100) DEFAULT %L', table_name, 'Maroc');
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP DEFAULT NOW()', table_name);
END;
$$ LANGUAGE plpgsql;

-- 3. Appliquer aux tables existantes
SELECT add_gps_columns_to_table('employees');
SELECT add_gps_columns_to_table('security_employees');
SELECT add_gps_columns_to_table('bebe_employees');
SELECT add_gps_columns_to_table('jardinage_employees');
SELECT add_gps_columns_to_table('driver_employees');
SELECT add_gps_columns_to_table('hand_worker_employees');

-- 4. Créer des index spatiaux pour toutes les tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY['employees', 'security_employees', 'bebe_employees', 'jardinage_employees', 'driver_employees', 'hand_worker_employees'])
    LOOP
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I USING gist (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL', 'idx_' || t || '_location', t);
    END LOOP;
END;
$$;
