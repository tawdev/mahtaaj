-- Enable RLS on driver_reservation table if it exists
ALTER TABLE IF EXISTS driver_reservation ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT ALL ON TABLE driver_reservation TO anon;
GRANT ALL ON TABLE driver_reservation TO authenticated;

-- Grant usage on all sequences in schema public (covers any ID sequence)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create policy to allow inserting reservations
DROP POLICY IF EXISTS "Allow insert for everyone" ON driver_reservation;
CREATE POLICY "Allow insert for everyone"
ON driver_reservation
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy to allow viewing own reservations (optional but good practice)
DROP POLICY IF EXISTS "Allow viewing own reservations" ON driver_reservation;
CREATE POLICY "Allow viewing own reservations"
ON driver_reservation
FOR SELECT
TO public
USING (true); -- Temporarily allow all for debugging
