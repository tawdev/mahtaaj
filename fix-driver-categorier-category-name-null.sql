-- ============================================
-- Fix driver_categorier table: Make category_name nullable
-- ============================================
-- This script makes category_name nullable to allow multilingual-only entries

-- Check if category_name has NOT NULL constraint
DO $$ 
BEGIN
  -- Make category_name nullable if it's not already
  ALTER TABLE driver_categorier 
    ALTER COLUMN category_name DROP NOT NULL;
  
  -- Make description nullable if it's not already
  ALTER TABLE driver_categorier 
    ALTER COLUMN description DROP NOT NULL;
    
  RAISE NOTICE 'Columns category_name and description are now nullable';
EXCEPTION
  WHEN OTHERS THEN
    -- Column might already be nullable or constraint doesn't exist
    RAISE NOTICE 'Columns may already be nullable or constraint does not exist: %', SQLERRM;
END $$;

-- Verify the changes
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'driver_categorier'
  AND column_name IN ('category_name', 'description')
ORDER BY column_name;

