-- Create types_menage table
-- This table stores types of menage services, related to the menage table

CREATE TABLE IF NOT EXISTS public.types_menage (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  -- Foreign key to menage table
  menage_id BIGINT NOT NULL REFERENCES public.menage(id) ON DELETE CASCADE,
  
  -- Names in 3 languages
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  
  -- Descriptions in 3 languages
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  
  -- Image URL or path
  image TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_types_menage_menage_id ON public.types_menage(menage_id);
CREATE INDEX IF NOT EXISTS idx_types_menage_created_at ON public.types_menage(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_types_menage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_types_menage_updated_at
  BEFORE UPDATE ON public.types_menage
  FOR EACH ROW
  EXECUTE FUNCTION update_types_menage_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.types_menage ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Public read access for types_menage"
  ON public.types_menage
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to insert (adjust based on your auth system)
-- For admin operations, you'll use service role key
CREATE POLICY "Authenticated insert access for types_menage"
  ON public.types_menage
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow authenticated users to update
CREATE POLICY "Authenticated update access for types_menage"
  ON public.types_menage
  FOR UPDATE
  USING (true);

-- Policy: Allow authenticated users to delete
CREATE POLICY "Authenticated delete access for types_menage"
  ON public.types_menage
  FOR DELETE
  USING (true);

-- Add comments for documentation
COMMENT ON TABLE public.types_menage IS 'Stores types of menage services, categorized by menage';
COMMENT ON COLUMN public.types_menage.menage_id IS 'Foreign key reference to the menage table';
COMMENT ON COLUMN public.types_menage.name_ar IS 'Name in Arabic';
COMMENT ON COLUMN public.types_menage.name_fr IS 'Name in French';
COMMENT ON COLUMN public.types_menage.name_en IS 'Name in English';
COMMENT ON COLUMN public.types_menage.description_ar IS 'Description in Arabic';
COMMENT ON COLUMN public.types_menage.description_fr IS 'Description in French';
COMMENT ON COLUMN public.types_menage.description_en IS 'Description in English';
COMMENT ON COLUMN public.types_menage.image IS 'URL or path to the image';

