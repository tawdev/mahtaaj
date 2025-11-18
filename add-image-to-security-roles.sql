-- ============================================
-- Ajouter la colonne 'image' à la table security_roles
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor
-- ============================================

-- Ajouter la colonne image si elle n'existe pas déjà
ALTER TABLE security_roles 
ADD COLUMN IF NOT EXISTS image TEXT;

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN security_roles.image IS 'URL de l''image de la catégorie de rôle de sécurité (stockée dans Supabase Storage)';

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'security_roles' AND column_name = 'image';

