import { useState, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Avatar } from './Avatar';
import { timeAgo, formatCount } from '../lib/utils';
import type { Post, Comment, Profile } from '../types';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const [liked, setLiked] = useState(post.liked_by_me ?? false);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [commentCount, setCommentCount] = useState(post.comments_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [heartBurst, setHeartBurst] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mediaIdx, setMediaIdx] = useState(0);

  const isOwner = profile?.id === post.user_id;

  const toggleLike = async () => {
    if (!profile) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => c + (newLiked ? 1 : -1));
    if (newLiked) {
      await supabase.from('likes').insert({ user_id: profile.id, post_id: post.id });
      if (post.user_id !== profile.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: profile.id,
          type: 'like',
          post_id: post.id,
          text: 'gönderini beğendi',
        });
      }
    } else {
      await supabase.from('likes').delete().eq('user_id', profile.id).eq('post_id', post.id);
    }
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profile:profiles(*)')
      .eq('post_id', post.id)
      .is('parent_id', null)
      .order('created_at', { ascending: true });
    if (data) setComments(data as unknown as Comment[]);
  };

  const submitComment = async () => {
    if (!commentText.trim() || !profile) return;
    const { data } = await supabase
      .from('comments')
      .insert({ user_id: profile.id, post_id: post.id, text: commentText })
      .select('*, profile:profiles(*)')
      .single();
    if (data) {
      setComments((c) => [...c, data as unknown as Comment]);
      setCommentCount((c) => c + 1);
      setCommentText('');
      if (post.user_id !== profile.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: profile.id,
          type: 'comment',
          post_id: post.id,
          text: 'gönderine yorum yaptı',
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu gönderiyi silmek istediğinden emin missin?')) return;
    await supabase.from('posts').delete().eq('id', post.id);
    onDelete?.();
  };

  const onDoubleClick = () => {
    if (!liked) toggleLike();
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 1000);
  };

  return (
    <article className="ig-card mb-4 overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between p-3">
        <button onClick={() => navigate({ name: 'profile', userId: post.user_id })} className="flex items-center gap-2">
          <Avatar profile={post.profile || { avatar_url: null, username: '', full_name: '' }} size={36} ring />
          <div className="text-left">
            <p className="text-sm font-semibold">{post.profile?.username || 'kullanıcı'}</p>
            {post.location && <p className="text-xs text-[var(--ig-muted)]">{post.location}</p>}
          </div>
        </button>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1"><MoreHorizontal size={20} /></button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-10 w-44 rounded-lg border bg-[var(--ig-surface)] py-1 shadow-xl animate-scale-in">
              {isOwner ? (
                <button onClick={handleDelete} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-500 hover:bg-gray-100 dark:hover:bg-zinc-900">
                  <Trash2 size={16} /> Sil
                </button>
              ) : (
                <button className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-500 hover:bg-gray-100 dark:hover:bg-zinc-900">
                  Şikayet Et
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative select-none" onDoubleClick={onDoubleClick}>
        {post.media_urls[mediaIdx]?.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
          <video src={post.media_urls[mediaIdx]} controls className="aspect-square w-full object-cover" />
        ) : (
          <img src={post.media_urls[mediaIdx]} alt="" className="aspect-square w-full object-cover" />
        )}
        {heartBurst && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart size={80} className="animate-heart-burst text-white" fill="white" />
          </div>
        )}
        {post.media_urls.length > 1 && (
          <>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
              {post.media_urls.map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === mediaIdx ? 'bg-[var(--ig-accent)]' : 'bg-white/50'}`} />
              ))}
            </div>
            {mediaIdx > 0 && <button onClick={() => setMediaIdx(mediaIdx - 1)} className="absolute left-2 top-1/2 rounded-full bg-white/80 p-1 text-black">‹</button>}
            {mediaIdx < post.media_urls.length - 1 && <button onClick={() => setMediaIdx(mediaIdx + 1)} className="absolute right-2 top-1/2 rounded-full bg-white/80 p-1 text-black">›</button>}
          </>
        )}
      </div>

      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-4">
          <button onClick={toggleLike}>
            <Heart size={24} className={liked ? 'text-rose-500' : 'text-[var(--ig-text)]'} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => { setShowComments(!showComments); if (!showComments) loadComments(); }}>
            <MessageCircle size={24} />
          </button>
          <button><Send size={24} /></button>
        </div>
        <button><Bookmark size={24} /></button>
      </div>

      <div className="px-3 pb-3">
        <p className="text-sm font-semibold">{formatCount(likeCount)} beğeni</p>
        {post.caption && (
          <p className="mt-1 text-sm">
            <span className="font-semibold">{post.profile?.username}</span> {post.caption}
          </p>
        )}
        {commentCount > 0 && !showComments && (
          <button onClick={() => { setShowComments(true); loadComments(); }} className="mt-1 text-sm text-[var(--ig-muted)]">
            {commentCount} yorumun tümünü gör
          </button>
        )}
        <p className="mt-1 text-xs text-[var(--ig-muted)]">{timeAgo(post.created_at)}</p>
      </div>

      {showComments && (
        <div className="border-t px-3 py-3">
          <div className="max-h-60 space-y-2 overflow-y-auto scrollbar-thin">
            {comments.map((c) => (
              <CommentItem key={c.id} comment={c} />
            ))}
            {comments.length === 0 && <p className="text-sm text-[var(--ig-muted)]">Henüz yorum yok. İlk yorumu sen yap!</p>}
          </div>
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
      )}
    </article>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const { profile } = useAuth();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<Comment[]>([]);

  const loadReplies = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profile:profiles(*)')
      .eq('parent_id', comment.id)
      .order('created_at', { ascending: true });
    if (data) setReplies(data as unknown as Comment[]);
  };

  const submitReply = async () => {
    if (!replyText.trim() || !profile) return;
    const { data } = await supabase
      .from('comments')
      .insert({ user_id: profile.id, post_id: comment.post_id, parent_id: comment.id, text: replyText })
      .select('*, profile:profiles(*)')
      .single();
    if (data) {
      setReplies((r) => [...r, data as unknown as Comment]);
      setReplyText('');
      setReplying(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Avatar profile={comment.profile || { avatar_url: null, username: '', full_name: '' }} size={28} />
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-semibold">{comment.profile?.username}</span> {comment.text}
        </p>
        <button onClick={() => { setReplying(!replying); if (replies.length === 0) loadReplies(); }} className="text-xs text-[var(--ig-muted)]">
          {timeAgo(comment.created_at)} • Yanıtla
        </button>
        {replies.length > 0 && (
          <div className="mt-2 space-y-2 border-l-2 pl-3">
            {replies.map((r) => (
              <div key={r.id} className="flex gap-2">
                <Avatar profile={r.profile || { avatar_url: null, username: '', full_name: '' }} size={24} />
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">{r.profile?.username}</span> {r.text}
                  </p>
                  <span className="text-xs text-[var(--ig-muted)]">{timeAgo(r.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {replying && (
          <div className="mt-2 flex items-center gap-2">
            <input
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitReply()}
              placeholder="Yanıt ekle..."
              className="ig-input text-xs"
            />
            <button onClick={submitReply} className="text-xs font-semibold text-[var(--ig-accent)]">Paylaş</button>
          </div>
        )}
      </div>
    </div>
  );
}

export type { Profile };
