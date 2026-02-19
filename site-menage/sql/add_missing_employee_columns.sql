-- Migration Supabase: Ajout des colonnes manquantes pour TOUTES les tables d'employés
-- Date: 2026-01-30

-- Fonction pour ajouter des colonnes de base si elles n'existent pas
CREATE OR REPLACE FUNCTION add_missing_columns_to_employee_table(table_name TEXT)
RETURNS void AS $$
BEGIN
    -- Colonnes d'identité et contact
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS first_name TEXT', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS last_name TEXT', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS full_name TEXT', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS email TEXT', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS phone TEXT', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS cin_number TEXT', table_name);

    -- Colonnes personnelles
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS birth_date DATE', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS age INTEGER', table_name);

    -- Colonnes de localisation (déjà partiellement fait par gps_migration, mais on assure la cohérence)
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS address TEXT', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS location_address TEXT', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8)', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8)', table_name);

    -- Colonnes professionnelles
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS expertise TEXT', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS auto_entrepreneur TEXT', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS last_experience TEXT', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS company_name TEXT', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS preferred_work_time TEXT', table_name);

    -- Colonnes système
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS photo_url TEXT', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS photo TEXT', table_name); -- Support pour l'ancien nom de colonne
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS status TEXT DEFAULT %L', table_name, 'pending');
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT %L', table_name, '{}');
END;
$$ LANGUAGE plpgsql;

-- Appliquer la fonction à toutes les tables d'employés
SELECT add_missing_columns_to_employee_table('employees');
SELECT add_missing_columns_to_employee_table('security_employees');
SELECT add_missing_columns_to_employee_table('bebe_employees');
SELECT add_missing_columns_to_employee_table('jardinage_employees');
SELECT add_missing_columns_to_employee_table('driver_employees');
SELECT add_missing_columns_to_employee_table('hand_worker_employees');

-- Recharger le cache du schéma (important pour PostgREST)
NOTIFY pgrst, 'reload schema';
