-- Script pour ajouter la colonne minimum_jours à la table hand_worker_categories
-- Exécuter ce script dans Supabase SQL Editor

-- Ajouter la colonne minimum_jours si elle n'existe pas
ALTER TABLE hand_worker_categories 
ADD COLUMN IF NOT EXISTS minimum_jours INTEGER DEFAULT 1;

-- Ajouter une contrainte pour s'assurer que minimum_jours est >= 1
ALTER TABLE hand_worker_categories 
ADD CONSTRAINT check_minimum_jours_positive 
CHECK (minimum_jours IS NULL OR minimum_jours >= 1);

-- Mettre à jour les valeurs NULL avec une valeur par défaut de 1
UPDATE hand_worker_categories 
SET minimum_jours = 1 
WHERE minimum_jours IS NULL;

-- Ajouter un commentaire à la colonne
COMMENT ON COLUMN hand_worker_categories.minimum_jours IS 'Nombre minimum de jours requis pour cette catégorie';

-- Vérifier que la colonne a été ajoutée correctement
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'hand_worker_categories' 
AND column_name = 'minimum_jours';

