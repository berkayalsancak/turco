import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Avatar } from '../components/Avatar';
import type { Reel } from '../types';
import { Heart, MessageCircle, Send, Music, Loader2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { timeAgo, formatCount } from '../lib/utils';

export function ReelsPage() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    supabase
      .from('reels')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setReels((data as unknown as Reel[]) || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--ig-muted)]" /></div>;
  }

  if (reels.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold">Henüz Reels yok</p>
        <p className="mt-1 text-sm text-[var(--ig-muted)]">İlk Reels'ini paylaş!</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-md flex-col gap-4 overflow-y-auto md:h-screen scrollbar-thin">
      {reels.map((reel, idx) => (
        <ReelCard
          key={reel.id}
          reel={reel}
          isActive={idx === activeIdx}
          onVisible={() => setActiveIdx(idx)}
          profileId={profile?.id || ''}
          onProfileClick={() => navigate({ name: 'profile', userId: reel.user_id })}
        />
      ))}
    </div>
  );
}

function ReelCard({ reel, isActive, onVisible, profileId, onProfileClick }: {
  reel: Reel;
  isActive: boolean;
  onVisible: () => void;
  profileId: string;
  onProfileClick: () => void;
}) {
  const [liked, setLiked] = useState(reel.liked_by_me ?? false);
  const [likeCount, setLikeCount] = useState(reel.likes_count);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible();
          videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.6 }
    );
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (isActive) videoRef.current?.play().catch(() => {});
    else videoRef.current?.pause();
  }, [isActive]);

  const toggleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => c + (newLiked ? 1 : -1));
    if (newLiked) {
      await supabase.from('likes').insert({ user_id: profileId, reel_id: reel.id });
      if (reel.user_id !== profileId) {
        await supabase.from('notifications').insert({
          user_id: reel.user_id, actor_id: profileId, type: 'like', reel_id: reel.id, text: 'reelsini beğendi',
        });
      }
    } else {
      await supabase.from('likes').delete().eq('user_id', profileId).eq('reel_id', reel.id);
    }
  };

  const togglePlay = () => {
    if (playing) videoRef.current?.pause();
    else videoRef.current?.play();
    setPlaying(!playing);
  };

  return (
    <div ref={containerRef} className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        src={reel.video_url}
        loop
        muted={muted}
        playsInline
        onClick={togglePlay}
        className="h-full w-full object-cover"
      />
      <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center">
        {!playing && <Play size={48} className="text-white/80" fill="white" />}
      </button>

      <div className="absolute left-0 right-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent p-3">
        <span className="text-sm font-semibold text-white">Reels</span>
        <button onClick={() => setMuted(!muted)} className="text-white">
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Avatar profile={reel.profile || { avatar_url: null, username: '', full_name: '' }} size={32} ring />
            <button onClick={onProfileClick} className="text-sm font-semibold text-white">{reel.profile?.username}</button>
          </div>
          {reel.caption && <p className="mt-2 text-sm text-white">{reel.caption}</p>}
          {reel.music && (
            <div className="mt-2 flex items-center gap-1 text-xs text-white/80">
              <Music size={12} /> {reel.music}
            </div>
          )}
          <p className="mt-1 text-xs text-white/60">{timeAgo(reel.created_at)}</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button onClick={toggleLike} className="flex flex-col items-center">
            <Heart size={28} className={liked ? 'text-rose-500' : 'text-white'} fill={liked ? 'currentColor' : 'none'} />
            <span className="text-xs text-white">{formatCount(likeCount)}</span>
          </button>
          <button className="flex flex-col items-center">
            <MessageCircle size={28} className="text-white" />
            <span className="text-xs text-white">{formatCount(reel.comments_count)}</span>
          </button>
          <button><Send size={28} className="text-white" /></button>
        </div>
      </div>
    </div>
  );
}


