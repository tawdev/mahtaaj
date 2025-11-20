-- ============================================
-- Script de mise à jour pour ajouter les champs multilingues
-- à la table driver_categorier
-- ============================================

-- Ajouter les colonnes multilingues si elles n'existent pas
DO $$ 
BEGIN
  -- Ajouter name_ar si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_categorier' AND column_name = 'name_ar') THEN
    ALTER TABLE driver_categorier ADD COLUMN name_ar TEXT;
  END IF;

  -- Ajouter name_fr si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_categorier' AND column_name = 'name_fr') THEN
    ALTER TABLE driver_categorier ADD COLUMN name_fr TEXT;
  END IF;

  -- Ajouter name_en si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_categorier' AND column_name = 'name_en') THEN
    ALTER TABLE driver_categorier ADD COLUMN name_en TEXT;
  END IF;

  -- Ajouter description_ar si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_categorier' AND column_name = 'description_ar') THEN
    ALTER TABLE driver_categorier ADD COLUMN description_ar TEXT;
  END IF;

  -- Ajouter description_fr si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_categorier' AND column_name = 'description_fr') THEN
    ALTER TABLE driver_categorier ADD COLUMN description_fr TEXT;
  END IF;

  -- Ajouter description_en si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_categorier' AND column_name = 'description_en') THEN
    ALTER TABLE driver_categorier ADD COLUMN description_en TEXT;
  END IF;
END $$;

-- Migrer les données existantes (optionnel - copier category_name vers name_fr si name_fr est vide)
UPDATE driver_categorier 
SET name_fr = category_name 
WHERE (name_fr IS NULL OR name_fr = '') 
  AND category_name IS NOT NULL 
  AND category_name != '';

-- Migrer les descriptions existantes (optionnel - copier description vers description_fr si description_fr est vide)
UPDATE driver_categorier 
SET description_fr = description 
WHERE (description_fr IS NULL OR description_fr = '') 
  AND description IS NOT NULL 
  AND description != '';

-- Afficher un message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE 'Les colonnes multilingues ont été ajoutées avec succès à la table driver_categorier';
END $$;

