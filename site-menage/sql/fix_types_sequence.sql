-- ============================================
-- Corriger la séquence de la clé primaire pour types
-- Fix primary key sequence for types table
-- ============================================

-- VERSION RAPIDE - Exécutez simplement cette ligne:
-- QUICK VERSION - Just execute this line:
SELECT setval('types_id_seq', COALESCE((SELECT MAX(id) FROM types), 0) + 1, false);

-- ============================================
-- VERSION COMPLÈTE AVEC VÉRIFICATIONS (optionnel)
-- COMPLETE VERSION WITH VERIFICATIONS (optional)
-- ============================================

-- Ce script corrige le problème de séquence désynchronisée
-- This script fixes the desynchronized sequence issue

-- ÉTAPE 1: Vérifier l'état actuel (optionnel - pour information)
-- STEP 1: Check current state (optional - for information)
SELECT 
  MAX(id) AS max_id_in_table,
  (SELECT last_value FROM types_id_seq) AS current_sequence_value
FROM types;

-- ÉTAPE 2: Réinitialiser la séquence (EXÉCUTEZ CECI)
-- STEP 2: Reset the sequence (EXECUTE THIS)
-- Le troisième paramètre 'false' signifie que la prochaine valeur sera celle spécifiée
-- The third parameter 'false' means the next value will be the one specified
SELECT setval(
  'types_id_seq',
  COALESCE((SELECT MAX(id) FROM types), 0) + 1,
  false
) AS sequence_reset_result;

-- ÉTAPE 3: Vérification (optionnel - pour confirmer que ça a fonctionné)
-- STEP 3: Verification (optional - to confirm it worked)
SELECT 
  last_value AS new_sequence_value,
  (SELECT MAX(id) FROM types) AS max_id_in_table,
  CASE 
    WHEN last_value > (SELECT MAX(id) FROM types) THEN '✅ Séquence corrigée'
    ELSE '⚠️ Vérifiez manuellement'
  END AS status
FROM types_id_seq;

-- ============================================
-- Notes importantes:
-- Important notes:
-- ============================================
-- 1. Exécutez ce script dans Supabase SQL Editor
--    Run this script in Supabase SQL Editor
-- 2. Après l'exécution, les nouvelles insertions devraient fonctionner
--    After execution, new insertions should work
-- 3. Si vous avez des erreurs, vérifiez le nom de la séquence avec:
--    If you have errors, check the sequence name with:
--    SELECT pg_get_serial_sequence('types', 'id');

