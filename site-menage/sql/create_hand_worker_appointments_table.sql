-- Create hand_worker_appointments table for simple appointment bookings
-- This table stores basic appointment requests with name, phone, email, date, and duration

CREATE TABLE IF NOT EXISTS hand_worker_appointments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id BIGINT REFERENCES hand_worker_categories(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  appointment_date DATE,
  duration_days INTEGER,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hand_worker_appointments_user_id ON hand_worker_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_hand_worker_appointments_category_id ON hand_worker_appointments(category_id);
CREATE INDEX IF NOT EXISTS idx_hand_worker_appointments_status ON hand_worker_appointments(status);
CREATE INDEX IF NOT EXISTS idx_hand_worker_appointments_date ON hand_worker_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_hand_worker_appointments_created_at ON hand_worker_appointments(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_hand_worker_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hand_worker_appointments_updated_at
  BEFORE UPDATE ON hand_worker_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_hand_worker_appointments_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE hand_worker_appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (for admin dashboard - admins will use service role key)
-- Note: In production, you may want to restrict this based on your admin authentication system
CREATE POLICY "Public read access for appointments"
  ON hand_worker_appointments
  FOR SELECT
  USING (true);

-- Policy: Allow public insert access (for booking form)
-- This allows anyone to create an appointment, even without authentication
CREATE POLICY "Public insert access for appointments"
  ON hand_worker_appointments
  FOR INSERT
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE hand_worker_appointments IS 'Stores simple appointment requests for hand worker services';
COMMENT ON COLUMN hand_worker_appointments.client_name IS 'Full name of the client';
COMMENT ON COLUMN hand_worker_appointments.client_phone IS 'Phone number of the client';
COMMENT ON COLUMN hand_worker_appointments.client_email IS 'Email address of the client';
COMMENT ON COLUMN hand_worker_appointments.appointment_date IS 'Preferred date for the appointment';
COMMENT ON COLUMN hand_worker_appointments.duration_days IS 'Duration of service in days';
COMMENT ON COLUMN hand_worker_appointments.status IS 'Status of the appointment: pending, confirmed, cancelled, or completed';

