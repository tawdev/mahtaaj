-- Add missing columns to reserve_security table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reserve_security' AND column_name='fullname') THEN
        ALTER TABLE reserve_security ADD COLUMN fullname TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reserve_security' AND column_name='phone') THEN
        ALTER TABLE reserve_security ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reserve_security' AND column_name='location') THEN
        ALTER TABLE reserve_security ADD COLUMN location TEXT;
    END IF;
END $$;
