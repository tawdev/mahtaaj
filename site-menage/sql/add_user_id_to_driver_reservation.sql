-- Add user_id column to driver_reservation table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_reservation' AND column_name='user_id') THEN
        ALTER TABLE driver_reservation ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;
