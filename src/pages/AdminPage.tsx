import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Avatar } from '../components/Avatar';
import type { Profile, Post, Reel } from '../types';
import { Users, FileText, Film, Ban, Trash2, Search, Shield, Loader2, TrendingUp } from 'lucide-react';
import { formatCount, timeAgo } from '../lib/utils';

type Tab = 'overview' | 'users' | 'posts' | 'reels' | 'blocks';

export function AdminPage() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ users: 0, posts: 0, reels: 0, blocks: 0 });

  useEffect(() => {
    if (!profile?.is_admin) { navigate({ name: 'home' }); return; }
    async function load() {
      const [{ data: u }, { data: p }, { data: r }, { data: b }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('posts').select('*, profile:profiles(*)').order('created_at', { ascending: false }).limit(100),
        supabase.from('reels').select('*, profile:profiles(*)').order('created_at', { ascending: false }).limit(100),
        supabase.from('blocks').select('*, blocker:profiles!blocker_id(*), blocked:profiles!blocked_id(*)').order('created_at', { ascending: false }),
      ]);
      setUsers((u as Profile[]) || []);
      setPosts((p as unknown as Post[]) || []);
      setReels((r as unknown as Reel[]) || []);
      setBlocks(b || []);
      setStats({
        users: u?.length || 0,
        posts: p?.length || 0,
        reels: r?.length || 0,
        blocks: b?.length || 0,
      });
      setLoading(false);
    }
    load();
  }, [profile?.id]);

  if (!profile?.is_admin) return null;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--ig-muted)]" /></div>;

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'overview', label: 'Genel', icon: TrendingUp },
    { key: 'users', label: 'Kullanıcılar', icon: Users },
    { key: 'posts', label: 'Gönderiler', icon: FileText },
    { key: 'reels', label: 'Reels', icon: Film },
    { key: 'blocks', label: 'Engellemeler', icon: Ban },
  ];

  const filteredUsers = users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));

  const toggleAdmin = async (id: string, current: boolean) => {
    await supabase.from('profiles').update({ is_admin: !current }).eq('id', id);
    setUsers((us) => us.map((u) => u.id === id ? { ...u, is_admin: !current } : u));
  };

  const deletePost = async (id: string) => {
    if (!confirm('Bu gönderiyi sil?')) return;
    await supabase.from('posts').delete().eq('id', id);
    setPosts((p) => p.filter((x) => x.id !== id));
  };

  const deleteReel = async (id: string) => {
    if (!confirm('Bu Reelsi sil?')) return;
    await supabase.from('reels').delete().eq('id', id);
    setReels((r) => r.filter((x) => x.id !== id));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center gap-2">
        <Shield size={24} className="text-[var(--ig-accent)]" />
        <h2 className="text-xl font-semibold">Admin Paneli</h2>
      </div>

      <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold ${
                tab === t.key ? 'border-b-2 border-[var(--ig-accent)] text-[var(--ig-accent)]' : 'text-[var(--ig-muted)]'
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Kullanıcılar', value: stats.users, icon: Users, color: 'from-sky-500 to-cyan-500' },
            { label: 'Gönderiler', value: stats.posts, icon: FileText, color: 'from-rose-500 to-pink-500' },
            { label: 'Reels', value: stats.reels, icon: Film, color: 'from-amber-500 to-orange-500' },
            { label: 'Engellemeler', value: stats.blocks, icon: Ban, color: 'from-violet-500 to-fuchsia-500' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="ig-card p-4">
                <div className={`mb-3 inline-flex rounded-lg bg-gradient-to-br ${s.color} p-2`}>
                  <Icon size={20} className="text-white" />
                </div>
                <p className="text-2xl font-bold">{formatCount(s.value)}</p>
                <p className="text-sm text-[var(--ig-muted)]">{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ig-muted)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kullanıcı ara..." className="ig-input pl-10" />
          </div>
          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <div key={u.id} className="ig-card flex items-center gap-3 p-3">
                <Avatar profile={u} size={40} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{u.username} {u.is_admin && <span className="ml-1 rounded bg-[var(--ig-accent)] px-1.5 py-0.5 text-[10px] text-white">ADMIN</span>}</p>
                  <p className="text-xs text-[var(--ig-muted)]">{u.full_name} • {formatCount(u.followers_count)} takipçi • {timeAgo(u.created_at)}</p>
                </div>
                {u.id !== profile.id && (
                  <button onClick={() => toggleAdmin(u.id, u.is_admin)} className="ig-btn-secondary text-xs">
                    {u.is_admin ? 'Yetkiyi Al' : 'Admin Yap'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'posts' && (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="ig-card flex items-center gap-3 p-3">
              <img src={p.media_urls[0]} alt="" className="h-12 w-12 rounded object-cover" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{p.profile?.username}</p>
                <p className="text-xs text-[var(--ig-muted)]">{p.caption?.slice(0, 50)} • {timeAgo(p.created_at)}</p>
              </div>
              <button onClick={() => deletePost(p.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {posts.length === 0 && <p className="py-12 text-center text-sm text-[var(--ig-muted)]">Gönderi yok</p>}
        </div>
      )}

      {tab === 'reels' && (
        <div className="space-y-2">
          {reels.map((r) => (
            <div key={r.id} className="ig-card flex items-center gap-3 p-3">
              <video src={r.video_url} className="h-12 w-12 rounded object-cover" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{r.profile?.username}</p>
                <p className="text-xs text-[var(--ig-muted)]">{r.caption?.slice(0, 50)} • {timeAgo(r.created_at)}</p>
              </div>
              <button onClick={() => deleteReel(r.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {reels.length === 0 && <p className="py-12 text-center text-sm text-[var(--ig-muted)]">Reels yok</p>}
        </div>
      )}

      {tab === 'blocks' && (
        <div className="space-y-2">
          {blocks.map((b) => (
            <div key={b.id} className="ig-card flex items-center gap-3 p-3">
              <Ban size={20} className="text-rose-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{b.blocker?.username} → {b.blocked?.username}</p>
                <p className="text-xs text-[var(--ig-muted)]">{timeAgo(b.created_at)}</p>
              </div>
            </div>
          ))}
          {blocks.length === 0 && <p className="py-12 text-center text-sm text-[var(--ig-muted)]">Engelleme yok</p>}
        </div>
      )}
    </div>
  );
}
