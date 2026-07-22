import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { StoryBar } from '../components/StoryBar';
import { PostCard } from '../components/PostCard';
import { Avatar } from '../components/Avatar';
import type { Post, Story } from '../types';
import { Loader2 } from 'lucide-react';

export function HomePage() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<{ id: string; username: string; full_name: string | null; avatar_url: string | null }[]>([]);

  useEffect(() => {
    async function load() {
      const [{ data: postsData }, { data: storiesData }, { data: suggestionsData }, { data: followingRows }] = await Promise.all([
        supabase
          .from('posts')
          .select('*, profile:profiles(*)')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('stories')
          .select('*, profile:profiles(*)')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .neq('id', profile?.id || '')
          .limit(20),
        profile
          ? supabase.from('follows').select('following_id').eq('follower_id', profile.id)
          : Promise.resolve({ data: [] as { following_id: string }[] }),
      ]);

      const followingIds = new Set((followingRows || []).map((f: any) => f.following_id));

      const postsWithLikes = postsData
        ? await Promise.all((postsData as unknown as Post[]).map(async (p) => {
            const [{ data: like }, { data: save }] = await Promise.all([
              supabase
                .from('likes')
                .select('id')
                .eq('post_id', p.id)
                .eq('user_id', profile?.id || '')
                .maybeSingle(),
              profile
                ? supabase.from('saves').select('id').eq('post_id', p.id).eq('user_id', profile.id).maybeSingle()
                : Promise.resolve({ data: null }),
            ]);
            return { ...p, liked_by_me: !!like, saved_by_me: !!save };
          }))
        : [];
      setPosts(postsWithLikes);
      setStories((storiesData as unknown as Story[]) || []);
      setSuggestions((suggestionsData || []).filter((s) => !followingIds.has(s.id)).slice(0, 5));
      setLoading(false);
    }
    load();
  }, [profile?.id]);

  const followSuggestion = async (id: string) => {
    if (!profile) return;
    const { error: followErr } = await supabase.from('follows').insert({ follower_id: profile.id, following_id: id });
    if (followErr) { console.error('Takip edilemedi:', followErr); return; }
    const { error: notifErr } = await supabase.from('notifications').insert({
      user_id: id,
      actor_id: profile.id,
      type: 'follow',
      text: 'seni takip etmeye başladı',
    });
    if (notifErr) console.error('Takip bildirimi oluşturulamadı:', notifErr);
    setSuggestions((prev) => prev.filter((x) => x.id !== id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--ig-muted)]" /></div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-0 md:px-4">
      <div className="mx-auto w-full max-w-[470px] md:mx-0">
        <div className="border-b md:border-0 md:py-2">
          <StoryBar stories={stories} />
        </div>
        {posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-semibold">Henüz gönderi yok</p>
            <p className="mt-1 text-sm text-[var(--ig-muted)]">İlk gönderini paylaş!</p>
          </div>
        ) : (
          posts.map((p) => (
            <PostCard key={p.id} post={p} onDelete={() => setPosts((prev) => prev.filter((x) => x.id !== p.id))} />
          ))
        )}
      </div>

      <aside className="hidden w-80 shrink-0 lg:block">
        <div className="sticky top-8 pt-8">
          <button
            onClick={() => profile && navigate({ name: 'profile', userId: profile.id })}
            className="flex w-full items-center gap-3 text-left"
          >
            <Avatar profile={profile || { avatar_url: null, username: '', full_name: '' }} size={48} ring />
            <div>
              <p className="text-sm font-semibold">{profile?.username}</p>
              <p className="text-sm text-[var(--ig-muted)]">{profile?.full_name}</p>
            </div>
          </button>

          <p className="mt-6 text-sm font-semibold text-[var(--ig-muted)]">Senin için öneriler</p>
          <div className="mt-2 space-y-2">
            {suggestions.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <button
                  onClick={() => navigate({ name: 'profile', userId: s.id })}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <Avatar profile={s} size={32} />
                  <div>
                    <p className="text-sm font-semibold">{s.username}</p>
                    <p className="text-xs text-[var(--ig-muted)]">Öneriliyor</p>
                  </div>
                </button>
                <button
                  onClick={() => followSuggestion(s.id)}
                  className="text-xs font-semibold text-[var(--ig-accent)]"
                >
                  Takip Et
                </button>
              </div>
            ))}
            {suggestions.length === 0 && (
              <p className="text-xs text-[var(--ig-muted)]">Şu an için öneri yok</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
