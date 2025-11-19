-- Ensure the storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('category_house', 'category_house', true, NULL, NULL)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow anyone (anon/admin) to read objects from the bucket
CREATE POLICY "Public read category_house"
ON storage.objects
FOR SELECT
USING (bucket_id = 'category_house');

-- Allow uploads to the bucket (anonymous role used by the web app)
CREATE POLICY "Allow anon upload category_house"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'category_house');

-- Allow updates (replacing files) inside the bucket
CREATE POLICY "Allow anon update category_house"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'category_house')
WITH CHECK (bucket_id = 'category_house');

-- Allow deletes from the bucket
CREATE POLICY "Allow anon delete category_house"
ON storage.objects
FOR DELETE
USING (bucket_id = 'category_house');

