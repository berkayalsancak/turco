import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Avatar } from '../components/Avatar';
import { LikesListModal } from '../components/LikesListModal';
import type { Post, Comment } from '../types';
import { ArrowLeft, Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { timeAgo, formatCount } from '../lib/utils';

export function PostDetailPage({ postId }: { postId: string }) {
  const { profile } = useAuth();
  const { navigate, back } = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('posts')
        .select('*, profile:profiles(*)')
        .eq('id', postId)
        .maybeSingle();
      if (cancelled) return;
      const p = data as unknown as Post | null;
      setPost(p);
      setLikeCount(p?.likes_count ?? 0);

      if (p && profile) {
        const [{ data: like }, { data: save }] = await Promise.all([
          supabase.from('likes').select('id').eq('post_id', p.id).eq('user_id', profile.id).maybeSingle(),
          supabase.from('saves').select('id').eq('post_id', p.id).eq('user_id', profile.id).maybeSingle(),
        ]);
        if (!cancelled) { setLiked(!!like); setSaved(!!save); }
      }

      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, profile:profiles(*)')
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });
      if (!cancelled) setComments((commentsData as unknown as Comment[]) || []);

      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [postId, profile?.id]);

  const toggleSave = async () => {
    if (!profile || !post) return;
    const next = !saved;
    setSaved(next);
    if (next) {
      const { error } = await supabase.from('saves').insert({ user_id: profile.id, post_id: post.id });
      if (error) { console.error('Kaydedilemedi:', error); setSaved(false); }
    } else {
      const { error } = await supabase.from('saves').delete().eq('user_id', profile.id).eq('post_id', post.id);
      if (error) { console.error('Kayıt kaldırılamadı:', error); setSaved(true); }
    }
  };

  const toggleLike = async () => {
    if (!profile || !post) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => c + (newLiked ? 1 : -1));
    if (newLiked) {
      const { error } = await supabase.from('likes').insert({ user_id: profile.id, post_id: post.id });
      if (error) { console.error('Beğeni eklenemedi:', error); return; }
      if (post.user_id !== profile.id) {
        const { error: notifErr } = await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: profile.id,
          type: 'like',
          post_id: post.id,
          text: 'gönderini beğendi',
        });
        if (notifErr) console.error('Beğeni bildirimi oluşturulamadı:', notifErr);
      }
    } else {
      const { error } = await supabase.from('likes').delete().eq('user_id', profile.id).eq('post_id', post.id);
      if (error) console.error('Beğeni kaldırılamadı:', error);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || !profile || !post) return;
    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: profile.id, post_id: post.id, text: commentText })
      .select('*, profile:profiles(*)')
      .single();
    if (error) { console.error('Yorum eklenemedi:', error); return; }
    if (data) {
      setComments((c) => [...c, data as unknown as Comment]);
      setCommentText('');
      if (post.user_id !== profile.id) {
        const { error: notifErr } = await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: profile.id,
          type: 'comment',
          post_id: post.id,
          text: 'gönderine yorum yaptı',
        });
        if (notifErr) console.error('Yorum bildirimi oluşturulamadı:', notifErr);
      }
    }
  };

  if (loading) return <div className="py-20 text-center text-[var(--ig-muted)]">Yükleniyor...</div>;
  if (!post) return <div className="py-20 text-center">Gönderi bulunamadı</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <button onClick={back} className="mb-4 flex items-center gap-2 text-sm">
        <ArrowLeft size={20} /> Geri
      </button>

      <div className="ig-card overflow-hidden md:flex">
        <div className="md:w-1/2">
          {post.media_urls[0]?.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
            <video src={post.media_urls[0]} controls className="aspect-square w-full object-cover" />
          ) : (
            <img src={post.media_urls[0]} alt="" className="aspect-square w-full object-cover" />
          )}
        </div>
        <div className="flex flex-1 flex-col md:w-1/2">
          <div className="flex items-center gap-2 border-b p-3">
            <button onClick={() => navigate({ name: 'profile', userId: post.user_id })}>
              <Avatar profile={post.profile || { avatar_url: null, username: '', full_name: '' }} size={36} ring />
            </button>
            <button onClick={() => navigate({ name: 'profile', userId: post.user_id })} className="text-sm font-semibold">
              {post.profile?.username}
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
            {post.caption && (
              <p className="text-sm">
                <button onClick={() => navigate({ name: 'profile', userId: post.user_id })} className="font-semibold">
                  {post.profile?.username}
                </button>{' '}
                {post.caption}
              </p>
            )}

            {comments.length === 0 ? (
              <p className="text-sm text-[var(--ig-muted)]">Henüz yorum yok. İlk yorumu sen yap!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <button onClick={() => navigate({ name: 'profile', userId: c.user_id })}>
                    <Avatar profile={c.profile || { avatar_url: null, username: '', full_name: '' }} size={28} />
                  </button>
                  <div>
                    <p className="text-sm">
                      <button onClick={() => navigate({ name: 'profile', userId: c.user_id })} className="font-semibold">
                        {c.profile?.username}
                      </button>{' '}
                      {c.text}
                    </p>
                    <span className="text-xs text-[var(--ig-muted)]">{timeAgo(c.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={toggleLike}>
                  <Heart size={24} className={liked ? 'text-rose-500' : 'text-[var(--ig-text)]'} fill={liked ? 'currentColor' : 'none'} />
                </button>
                <button>
                  <MessageCircle size={24} />
                </button>
                <button><Send size={24} /></button>
              </div>
              <button onClick={toggleSave}>
                <Bookmark size={24} fill={saved ? 'currentColor' : 'none'} />
              </button>
            </div>
            <button onClick={() => setShowLikes(true)} className="mt-2 text-sm font-semibold hover:underline">
              {formatCount(likeCount)} beğeni
            </button>
            <p className="text-xs text-[var(--ig-muted)]">{timeAgo(post.created_at)}</p>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                placeholder="Yorum ekle..."
                className="ig-input"
              />
              <button onClick={submitComment} disabled={!commentText.trim()} className="text-sm font-semibold text-[var(--ig-accent)] disabled:opacity-40">
                Paylaş
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLikes && <LikesListModal postId={post.id} onClose={() => setShowLikes(false)} />}
    </div>
  );
}
