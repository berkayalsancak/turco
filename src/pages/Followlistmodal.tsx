import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../context/RouterContext';
import { Avatar } from './Avatar';
import type { Profile } from '../types';

interface FollowListModalProps {
  userId: string;
  mode: 'followers' | 'following';
  onClose: () => void;
}

export function FollowListModal({ userId, mode, onClose }: FollowListModalProps) {
  const { navigate } = useRouter();
  const [list, setList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const query =
        mode === 'followers'
          ? supabase.from('follows').select('follower:profiles!follower_id(*)').eq('following_id', userId)
          : supabase.from('follows').select('following:profiles!following_id(*)').eq('follower_id', userId);
      const { data } = await query;
      const profiles = (data || [])
        .map((row: any) => (mode === 'followers' ? row.follower : row.following))
        .filter(Boolean);
      if (!cancelled) {
        setList(profiles as Profile[]);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, mode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="ig-card w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-base font-semibold">{mode === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2 scrollbar-thin">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-[var(--ig-muted)]" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--ig-muted)]">
              {mode === 'followers' ? 'Henüz takipçi yok' : 'Henüz kimse takip edilmiyor'}
            </p>
          ) : (
            list.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onClose();
                  navigate({ name: 'profile', userId: p.id });
                }}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-gray-100 dark:hover:bg-zinc-900"
              >
                <Avatar profile={p} size={44} />
                <div>
                  <p className="text-sm font-semibold">{p.username}</p>
                  <p className="text-xs text-[var(--ig-muted)]">{p.full_name}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
