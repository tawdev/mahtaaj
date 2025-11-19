-- Fix des erreurs d'insertion sur la table services (duplicate key sur services_pkey)
-- À exécuter une fois sur la base Supabase après avoir inséré des données avec des IDs explicites.
-- Cela repositionne la séquence services_id_seq sur la valeur MAX(id)+1.

SELECT
  setval(
    pg_get_serial_sequence('services', 'id'),
    COALESCE((SELECT MAX(id) + 1 FROM services), 1),
    false
  );

-- Vérifier ensuite que la séquence retourne bien la prochaine valeur disponible :
-- SELECT nextval(pg_get_serial_sequence('services', 'id'));

