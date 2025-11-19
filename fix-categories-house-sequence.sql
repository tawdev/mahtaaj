-- Sync the categories_house sequence to avoid duplicate primary key errors.
-- Run this once in Supabase SQL Editor if inserts fail with
-- "duplicate key value violates unique constraint \"categories_house_pkey\"".

SELECT
  setval(
    pg_get_serial_sequence('categories_house', 'id'),
    COALESCE((SELECT MAX(id) + 1 FROM categories_house), 1),
    false
  );

-- Optional: verify the next value
-- SELECT nextval(pg_get_serial_sequence('categories_house', 'id'));

