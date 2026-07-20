/*
# Create media storage bucket

1. Storage
- `media` bucket: public, used for posts, stories, reels, avatars
2. Security
- Public read, authenticated write
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_write" ON storage.objects;
CREATE POLICY "media_auth_write" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_update" ON storage.objects;
CREATE POLICY "media_auth_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_delete" ON storage.objects;
CREATE POLICY "media_auth_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'media');
