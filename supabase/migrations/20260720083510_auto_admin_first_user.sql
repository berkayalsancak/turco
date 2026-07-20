/*
# Auto-admin first user

1. Logic
- İlk kayıt olan kullanıcı (profiles tablosunda tek kayıt) otomatik is_admin=true olur.
- Bu migration mevcut tek kullanıcıyı da admin yapar.
*/

DO $$
DECLARE
  user_count integer;
  first_id uuid;
BEGIN
  SELECT count(*) INTO user_count FROM profiles;
  IF user_count = 1 THEN
    SELECT id INTO first_id FROM profiles LIMIT 1;
    UPDATE profiles SET is_admin = true WHERE id = first_id;
  END IF;
END $$;
