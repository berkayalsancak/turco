import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../context/RouterContext';
import { Avatar } from '../components/Avatar';
import type { Post } from '../types';
import { Loader2, Search as SearchIcon, X } from 'lucide-react';

export function ExplorePage() {
  const { navigate } = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; username: string; full_name: string | null; avatar_url: string | null }[]>([]);

  useEffect(() => {
    supabase
      .from('posts')
      .select('*, profile:profiles(*)')
      .order('likes_count', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setPosts((data as unknown as Post[]) || []);
        setLoading(false);
      });
  }, []);

  const search = async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .ilike('username', `%${q}%`)
      .limit(10);
    setResults(data || []);
  };

  return (
    <div className="mx-auto max-w-4xl px-2 py-4 md:px-4">
      <div className="relative mb-4">
        <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ig-muted)]" />
        <input
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Kullanıcı ara"
          className="ig-input pl-10"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={18} className="text-[var(--ig-muted)]" />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="mb-6 space-y-2">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate({ name: 'profile', userId: r.id })}
              className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-900"
            >
              <Avatar profile={r} size={44} />
              <div className="text-left">
                <p className="text-sm font-semibold">{r.username}</p>
                <p className="text-sm text-[var(--ig-muted)]">{r.full_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--ig-muted)]" /></div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate({ name: 'post', postId: p.id })}
              className="aspect-square overflow-hidden rounded"
            >
              {p.media_urls[0]?.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
                <video src={p.media_urls[0]} className="h-full w-full object-cover" />
              ) : (
                <img src={p.media_urls[0]} alt="" className="h-full w-full object-cover transition hover:scale-105" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
