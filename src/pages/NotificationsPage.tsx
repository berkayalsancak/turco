import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Avatar } from '../components/Avatar';
import type { Notification } from '../types';
import { Heart, UserPlus, MessageCircle, AtSign, Loader2 } from 'lucide-react';
import { timeAgo } from '../lib/utils';

export function NotificationsPage() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('notifications')
      .select('*, actor:profiles!actor_id(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setNotifications((data as unknown as Notification[]) || []);
        setLoading(false);
      });
  }, [profile?.id]);

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false);
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  };

  const iconFor = (type: string) => {
    if (type === 'like') return <Heart size={16} className="text-rose-500" fill="currentColor" />;
    if (type === 'follow') return <UserPlus size={16} className="text-[var(--ig-accent)]" />;
    if (type === 'comment') return <MessageCircle size={16} className="text-sky-500" />;
    return <AtSign size={16} className="text-amber-500" />;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--ig-muted)]" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Bildirimler</h2>
        {notifications.some((n) => !n.read) && (
          <button onClick={markAllRead} className="text-sm font-semibold text-[var(--ig-accent)]">Tümünü okundu işaretle</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-20 text-center">
          <Heart size={48} className="mx-auto text-[var(--ig-muted)]" />
          <p className="mt-3 text-sm text-[var(--ig-muted)]">Henüz bildirim yok</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => n.actor_id && navigate({ name: 'profile', userId: n.actor_id })}
              className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-gray-100 dark:hover:bg-zinc-900 ${!n.read ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
            >
              <div className="relative">
                <Avatar profile={n.actor || { avatar_url: null, username: '', full_name: '' }} size={44} />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ig-surface)] ring-2 ring-[var(--ig-surface)]">
                  {iconFor(n.type)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{n.actor?.username}</span> {n.text}
                </p>
                <p className="text-xs text-[var(--ig-muted)]">{timeAgo(n.created_at)}</p>
              </div>
              {!n.read && <span className="h-2 w-2 rounded-full bg-[var(--ig-accent)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
