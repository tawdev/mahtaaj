# ⚠️ IMPORTANT: Database Update Required

## Problem
If you're seeing errors like:
- `400 (Bad Request)` when creating driver reservations
- `column "full_name" does not exist`
- `column "email" does not exist`

This means the database table `driver_reservation` needs to be updated.

## Solution

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Run the Update Script
Copy and paste the entire contents of `update-driver-reservation-table.sql` into the SQL Editor and click "Run".

Alternatively, you can run this SQL directly:

```sql
-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add full_name column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_reservation' AND column_name = 'full_name') THEN
    ALTER TABLE driver_reservation ADD COLUMN full_name TEXT;
  END IF;

  -- Add email column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_reservation' AND column_name = 'email') THEN
    ALTER TABLE driver_reservation ADD COLUMN email TEXT;
  END IF;

  -- Add phone column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_reservation' AND column_name = 'phone') THEN
    ALTER TABLE driver_reservation ADD COLUMN phone TEXT;
  END IF;

  -- Add reservation_time column (time of day)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_reservation' AND column_name = 'reservation_time') THEN
    ALTER TABLE driver_reservation ADD COLUMN reservation_time TIME;
  END IF;

  -- Add address column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_reservation' AND column_name = 'address') THEN
    ALTER TABLE driver_reservation ADD COLUMN address TEXT;
  END IF;

  -- Add message column (Additional Message)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'driver_reservation' AND column_name = 'message') THEN
    ALTER TABLE driver_reservation ADD COLUMN message TEXT;
  END IF;

  RAISE NOTICE 'Les colonnes ont été ajoutées avec succès à la table driver_reservation';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de l''ajout des colonnes: %', SQLERRM;
END $$;
```

### Step 3: Verify
After running the script, verify the columns were added by running:

```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'driver_reservation'
ORDER BY ordinal_position;
```

You should see the new columns:
- `full_name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `reservation_time` (TIME)
- `address` (TEXT)
- `message` (TEXT)

### Step 4: Test
After updating the database, try creating a driver reservation again. It should work now!

## New Fields Added to driver_reservation Table

- **full_name** - Nom complet du client
- **email** - Email du client
- **phone** - Numéro de téléphone du client
- **reservation_time** - Heure de la réservation (TIME type)
- **address** - Adresse du client
- **message** - Message supplémentaire du client

These fields are now displayed in the admin dashboard at `/admin/driver/reservations`.

