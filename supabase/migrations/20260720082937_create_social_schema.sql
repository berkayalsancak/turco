/*
# Instagram-benzeri sosyal medya semasi

1. Yeni Tablolar
- `profiles` — kullanicilarin herkese acik profili (auth.users ile 1:1). Kullanici adi, bio, avatar, web sitesi, is_admin bayragi.
- `posts` — kullanici paylasimlari (resim/video + altyazi). story/reels disinda ana akil gonderileri.
- `stories` — 24 saatlik hikayeler (resim/video, 24 saat sonra otomatik silinir).
- `reels` — kisa video paylasimlari (video_url, baslik, muzik).
- `follows` — takip iliskileri (follower -> following).
- `blocks` — engelleme iliskileri (blocker -> blocked).
- `likes` — gonderi begenileri.
- `comments` — gonderi yorumlari (ust yoruma cevap destekli).
- `messages` — ozel mesajlasma (1:1 veya grup, metin/resim).
- `conversations` — mesajlasma oturumlari (iki kisi arasi).
- `calls` — sesli arama kayitlari ve signaling durumu.
- `notifications` — takip, begeni, yorum, mesaj bildirimleri.

2. Guvenlik
- Tum tablolarda RLS etkin.
- `profiles`: herkes okuyabilir, sadece sahip guncelleyebilir.
- `posts/stories/reels`: herkes okuyabilir, sadece sahip olusturur/gunceller/siler.
- `follows`: herkes okuyabilir, sadece kendi takip iliskini olusturur/siler.
- `blocks`: herkes kendi engellemelerini okur, sadece kendi engellerini olusturur/siler.
- `likes`: herkes okuyabilir, sadece kendi begenisini olusturur/siler.
- `comments`: herkes okuyabilir, sadece kendi yorumunu olusturur/suncelersiler.
- `messages`: sadece sohbet katilimcilari okuyabilir/yazabilir.
- `conversations`: sadece katilimcilar okuyabilir.
- `calls`: sadece arama katilimcilari okuyabilir, arayan olusturur.
- `notifications`: sadece bildirim sahibi okuyabilir.

3. Onemli Notlar
- `profiles.id` = `auth.users.id` (DEFAULT auth.uid()).
- `is_admin` varsayilan false; admin paneline erisim icin kullanilir.
- `stories` 24 saat sonra silinir (Supabase storage policy veya uygulama katmaninda).
- Tum tablolarda `created_at` varsayilan now().
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  bio text,
  avatar_url text,
  website text,
  is_private boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  followers_count integer NOT NULL DEFAULT 0,
  following_count integer NOT NULL DEFAULT 0,
  posts_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- POSTS
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  media_urls text[] NOT NULL,
  caption text,
  location text,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

DROP POLICY IF EXISTS "posts_select_all" ON posts;
CREATE POLICY "posts_select_all" ON posts FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own" ON posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own" ON posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own" ON posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- STORIES
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);

DROP POLICY IF EXISTS "stories_select_all" ON stories;
CREATE POLICY "stories_select_all" ON stories FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "stories_insert_own" ON stories;
CREATE POLICY "stories_insert_own" ON stories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "stories_delete_own" ON stories;
CREATE POLICY "stories_delete_own" ON stories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- REELS
CREATE TABLE IF NOT EXISTS reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  caption text,
  music text,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);

DROP POLICY IF EXISTS "reels_select_all" ON reels;
CREATE POLICY "reels_select_all" ON reels FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "reels_insert_own" ON reels;
CREATE POLICY "reels_insert_own" ON reels FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "reels_update_own" ON reels;
CREATE POLICY "reels_update_own" ON reels FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "reels_delete_own" ON reels;
CREATE POLICY "reels_delete_own" ON reels FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- FOLLOWS
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

DROP POLICY IF EXISTS "follows_select_all" ON follows;
CREATE POLICY "follows_select_all" ON follows FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "follows_insert_own" ON follows;
CREATE POLICY "follows_insert_own" ON follows FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "follows_delete_own" ON follows;
CREATE POLICY "follows_delete_own" ON follows FOR DELETE
  TO authenticated USING (auth.uid() = follower_id);

-- BLOCKS
CREATE TABLE IF NOT EXISTS blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);

DROP POLICY IF EXISTS "blocks_select_own" ON blocks;
CREATE POLICY "blocks_select_own" ON blocks FOR SELECT
  TO authenticated USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
DROP POLICY IF EXISTS "blocks_insert_own" ON blocks;
CREATE POLICY "blocks_insert_own" ON blocks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = blocker_id);
DROP POLICY IF EXISTS "blocks_delete_own" ON blocks;
CREATE POLICY "blocks_delete_own" ON blocks FOR DELETE
  TO authenticated USING (auth.uid() = blocker_id);

-- LIKES (posts + reels)
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  reel_id uuid REFERENCES reels(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((post_id IS NOT NULL AND reel_id IS NULL) OR (post_id IS NULL AND reel_id IS NOT NULL))
);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_reel ON likes(reel_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

DROP POLICY IF EXISTS "likes_select_all" ON likes;
CREATE POLICY "likes_select_all" ON likes FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own" ON likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own" ON likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- COMMENTS (posts + reels, nested)
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  reel_id uuid REFERENCES reels(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((post_id IS NOT NULL AND reel_id IS NULL) OR (post_id IS NULL AND reel_id IS NOT NULL))
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_reel ON comments(reel_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all" ON comments FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own" ON comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "comments_update_own" ON comments;
CREATE POLICY "comments_update_own" ON comments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own" ON comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user1_id, user2_id),
  CHECK (user1_id <> user2_id)
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participants" ON conversations;
CREATE POLICY "conversations_select_participants" ON conversations FOR SELECT
  TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);
DROP POLICY IF EXISTS "conversations_insert_participants" ON conversations;
CREATE POLICY "conversations_insert_participants" ON conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
DROP POLICY IF EXISTS "conversations_delete_participants" ON conversations;
CREATE POLICY "conversations_delete_participants" ON conversations FOR DELETE
  TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  text text,
  media_url text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

DROP POLICY IF EXISTS "messages_select_participants" ON messages;
CREATE POLICY "messages_select_participants" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS "messages_insert_participants" ON messages;
CREATE POLICY "messages_insert_participants" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
      AND messages.sender_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "messages_update_own" ON messages;
CREATE POLICY "messages_update_own" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

-- CALLS (voice call signaling/log)
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  callee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'initiated',
  offer_sdp text,
  answer_sdp text,
  ice_candidates text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_calls_callee ON calls(callee_id);

DROP POLICY IF EXISTS "calls_select_participants" ON calls;
CREATE POLICY "calls_select_participants" ON calls FOR SELECT
  TO authenticated USING (auth.uid() = caller_id OR auth.uid() = callee_id);
DROP POLICY IF EXISTS "calls_insert_caller" ON calls;
CREATE POLICY "calls_insert_caller" ON calls FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = caller_id);
DROP POLICY IF EXISTS "calls_update_participants" ON calls;
CREATE POLICY "calls_update_participants" ON calls FOR UPDATE
  TO authenticated USING (auth.uid() = caller_id OR auth.uid() = callee_id)
  WITH CHECK (auth.uid() = caller_id OR auth.uid() = callee_id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  post_id uuid,
  reel_id uuid,
  text text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = actor_id);
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();