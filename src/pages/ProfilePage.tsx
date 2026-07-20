import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Avatar } from '../components/Avatar';
import { PostCard } from '../components/PostCard';
import type { Post, Profile } from '../types';
import { Settings, Grid, Film, Bookmark, UserPlus, UserMinus, Ban, MessageCircle, Phone, Loader2, Camera, Check } from 'lucide-react';
import { formatCount } from '../lib/utils';

interface ProfilePageProps {
  userId: string;
}

export function ProfilePage({ userId }: ProfilePageProps) {
  const { profile: me, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<{ id: string; video_url: string; caption: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'reels' | 'saved'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', full_name: '', bio: '', website: '', avatar_url: '' });

  const isOwner = me?.id === userId;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      setProfile(prof as Profile | null);
      if (prof) setEditForm({
        username: prof.username,
        full_name: prof.full_name || '',
        bio: prof.bio || '',
        website: prof.website || '',
        avatar_url: prof.avatar_url || '',
      });

      const [{ data: postData }, { data: reelData }, { data: followData }, { data: blockData }] = await Promise.all([
        supabase.from('posts').select('*, profile:profiles(*)').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('reels').select('id, video_url, caption').eq('user_id', userId).order('created_at', { ascending: false }),
        me ? supabase.from('follows').select('id').eq('follower_id', me.id).eq('following_id', userId).maybeSingle() : Promise.resolve({ data: null }),
        me ? supabase.from('blocks').select('id').eq('blocker_id', me.id).eq('blocked_id', userId).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setPosts((postData as unknown as Post[]) || []);
      setReels(reelData || []);
      setIsFollowing(!!followData);
      setIsBlocked(!!blockData);
      setLoading(false);
    }
    load();
  }, [userId, me?.id]);

  const toggleFollow = async () => {
    if (!me || !profile) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', userId);
      setIsFollowing(false);
      setProfile((p) => p ? { ...p, followers_count: p.followers_count - 1 } : p);
    } else {
      await supabase.from('follows').insert({ follower_id: me.id, following_id: userId });
      await supabase.from('notifications').insert({
        user_id: userId, actor_id: me.id, type: 'follow', text: 'seni takip etmeye başladı',
      });
      setIsFollowing(true);
      setProfile((p) => p ? { ...p, followers_count: p.followers_count + 1 } : p);
    }
  };

  const toggleBlock = async () => {
    if (!me) return;
    if (isBlocked) {
      await supabase.from('blocks').delete().eq('blocker_id', me.id).eq('blocked_id', userId);
      setIsBlocked(false);
    } else {
      await supabase.from('blocks').insert({ blocker_id: me.id, blocked_id: userId });
      await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', userId);
      await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', me.id);
      setIsBlocked(true);
      setIsFollowing(false);
    }
    setShowMenu(false);
  };

  const saveEdit = async () => {
    if (!me) return;
    const { error } = await supabase.from('profiles').update({
      username: editForm.username,
      full_name: editForm.full_name,
      bio: editForm.bio,
      website: editForm.website,
      avatar_url: editForm.avatar_url,
    }).eq('id', me.id);
    if (error) { alert(error.message); return; }
    await refreshProfile();
    setProfile((p) => p ? { ...p, ...editForm } : p);
    setEditing(false);
  };

  const uploadAvatar = async (file: File) => {
    if (!me) return;
    const path = `avatars/${me.id}/${Date.now()}.${file.name.split('.').pop()}`;
    const { error: upErr } = await supabase.storage.from('media').upload(path, file);
    if (upErr) { alert(upErr.message); return; }
    const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
    setEditForm((f) => ({ ...f, avatar_url: pub.publicUrl }));
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--ig-muted)]" /></div>;
  }

  if (!profile) {
    return <div className="py-20 text-center"><p className="text-lg font-semibold">Kullanıcı bulunamadı</p></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex justify-center md:justify-start">
          <Avatar profile={profile} size={88} ring />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-light">{profile.username}</h1>
            {isOwner ? (
              <div className="flex gap-2">
                <button onClick={() => setEditing(true)} className="ig-btn-secondary">Profili Düzenle</button>
                <button onClick={() => navigate({ name: 'settings' })} className="ig-btn-ghost"><Settings size={20} /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={toggleFollow} className={isFollowing ? 'ig-btn-secondary' : 'ig-btn'}>
                  {isFollowing ? <><UserMinus size={16} /> Takipten Çık</> : <><UserPlus size={16} /> Takip Et</>}
                </button>
                <button onClick={() => navigate({ name: 'messages' })} className="ig-btn-secondary"><MessageCircle size={18} /></button>
                <div className="relative">
                  <button onClick={() => setShowMenu(!showMenu)} className="ig-btn-ghost"><Settings size={20} /></button>
                  {showMenu && (
                    <div className="absolute right-0 top-10 z-10 w-44 rounded-lg border bg-[var(--ig-surface)] py-1 shadow-xl animate-scale-in">
                      <button onClick={toggleBlock} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-zinc-900">
                        <Ban size={16} className="text-rose-500" /> {isBlocked ? 'Engeli Kaldır' : 'Engelle'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-6">
            <p><span className="font-semibold">{formatCount(profile.posts_count)}</span> gönderi</p>
            <p><span className="font-semibold">{formatCount(profile.followers_count)}</span> takipçi</p>
            <p><span className="font-semibold">{formatCount(profile.following_count)}</span> takip</p>
          </div>

          {profile.full_name && <p className="mt-3 font-semibold text-sm">{profile.full_name}</p>}
          {profile.bio && <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>}
          {profile.website && <a href={profile.website} target="_blank" rel="noopener" className="text-sm text-[var(--ig-accent)]">{profile.website}</a>}
        </div>
      </div>

      <div className="flex justify-around border-t">
        {[
          { key: 'posts' as const, icon: Grid, label: 'Gönderiler' },
          { key: 'reels' as const, icon: Film, label: 'Reels' },
          ...(isOwner ? [{ key: 'saved' as const, icon: Bookmark, label: 'Kaydedilenler' }] : []),
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wide ${
                tab === t.key ? 'border-t-2 border-[var(--ig-text)] text-[var(--ig-text)]' : 'text-[var(--ig-muted)]'
              }`}
            >
              <Icon size={16} /> <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {tab === 'posts' && (
          posts.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--ig-muted)]">Henüz gönderi yok</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((p) => (
                <button key={p.id} onClick={() => navigate({ name: 'post', postId: p.id })} className="aspect-square overflow-hidden rounded">
                  {p.media_urls[0]?.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
                    <video src={p.media_urls[0]} className="h-full w-full object-cover" />
                  ) : (
                    <img src={p.media_urls[0]} alt="" className="h-full w-full object-cover transition hover:scale-105" />
                  )}
                </button>
              ))}
            </div>
          )
        )}
        {tab === 'reels' && (
          reels.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--ig-muted)]">Henüz Reels yok</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {reels.map((r) => (
                <button key={r.id} className="relative aspect-[9/16] overflow-hidden rounded">
                  <video src={r.video_url} className="h-full w-full object-cover" />
                  <Film size={20} className="absolute right-1 top-1 text-white" />
                </button>
              ))}
            </div>
          )
        )}
        {tab === 'saved' && <p className="py-12 text-center text-sm text-[var(--ig-muted)]">Kaydedilen gönderiler burada görünür</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(false)}>
          <div className="ig-card w-full max-w-md p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">Profili Düzenle</h3>
            <div className="mb-4 flex justify-center">
              <label className="relative cursor-pointer">
                <Avatar profile={editForm} size={80} />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-[var(--ig-accent)] p-1.5 text-white">
                  <Camera size={14} />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              </label>
            </div>
            <div className="space-y-3">
              <input className="ig-input" placeholder="Kullanıcı adı" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
              <input className="ig-input" placeholder="Ad Soyad" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
              <textarea className="ig-input resize-none" placeholder="Bio" rows={3} value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
              <input className="ig-input" placeholder="Web sitesi" value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="ig-btn-secondary">İptal</button>
              <button onClick={saveEdit} className="ig-btn"><Check size={16} /> Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { Phone };
