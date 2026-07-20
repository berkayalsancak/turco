import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../context/RouterContext';
import { Avatar } from '../components/Avatar';
import type { Post } from '../types';
import { ArrowLeft, X, Heart, MessageCircle, Send } from 'lucide-react';
import { timeAgo, formatCount } from '../lib/utils';

export function PostDetailPage({ postId }: { postId: string }) {
  const { navigate } = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('posts')
      .select('*, profile:profiles(*)')
      .eq('id', postId)
      .maybeSingle()
      .then(({ data }) => {
        setPost(data as unknown as Post | null);
        setLoading(false);
      });
  }, [postId]);

  if (loading) return <div className="py-20 text-center text-[var(--ig-muted)]">Yükleniyor...</div>;
  if (!post) return <div className="py-20 text-center">Gönderi bulunamadı</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <button onClick={() => navigate({ name: 'home' })} className="mb-4 flex items-center gap-2 text-sm">
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
            <Avatar profile={post.profile || { avatar_url: null, username: '', full_name: '' }} size={36} ring />
            <button onClick={() => navigate({ name: 'profile', userId: post.user_id })} className="text-sm font-semibold">
              {post.profile?.username}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            {post.caption && (
              <p className="mb-3 text-sm">
                <span className="font-semibold">{post.profile?.username}</span> {post.caption}
              </p>
            )}
            <p className="text-xs text-[var(--ig-muted)]">{timeAgo(post.created_at)}</p>
          </div>
          <div className="border-t p-3">
            <div className="flex items-center gap-4">
              <Heart size={24} />
              <MessageCircle size={24} />
              <Send size={24} />
            </div>
            <p className="mt-2 text-sm font-semibold">{formatCount(post.likes_count)} beğeni</p>
          </div>
        </div>
      </div>
    </div>
  );
}
