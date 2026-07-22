import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Avatar } from '../components/Avatar';
import type { Notification } from '../types';
import { Heart, UserPlus, MessageCircle, AtSign, Loader2, Send } from 'lucide-react';
import { timeAgo } from '../lib/utils';

interface NotificationRow extends Notification {
  post?: { id: string; media_urls: string[] } | null;
  reel?: { id: string; video_url: string } | null;
}

const NOTIF_PREF_KEY = 'sosyalagi_notification_prefs';
const TYPE_TO_PREF: Record<string, string> = {
  like: 'likes',
  comment: 'comments',
  follow: 'follows',
  message: 'messages',
};

const NOTIFICATION_SELECT = '*, actor:profiles!actor_id(*), post:posts(id, media_urls), reel:reels(id, video_url)';

function loadNotifPrefs() {
  try {
    const raw = localStorage.getItem(NOTIF_PREF_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    // yoksay
  }
  return { likes: true, comments: true, follows: true, messages: true };
}

export function NotificationsPage() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefs] = useState(loadNotifPrefs);

  const visibleNotifications = notifications.filter((n) => {
    const prefKey = TYPE_TO_PREF[n.type];
    return prefKey ? prefs[prefKey] !== false : true;
  });

  useEffect(() => {
    if (!profile) return;

    supabase
      .from('notifications')
      .select(NOTIFICATION_SELECT)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) console.error('Bildirimler yüklenemedi:', error);
        setNotifications((data as unknown as NotificationRow[]) || []);
        setLoading(false);
      });

    // Yeni bildirimler geldiğinde (örn. biri gönderini beğendiğinde) sayfa
    // yenilenmeden anlık olarak listeye eklensin.
    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        async (payload) => {
          const { data, error } = await supabase
            .from('notifications')
            .select(NOTIFICATION_SELECT)
            .eq('id', (payload.new as { id: string }).id)
            .maybeSingle();
          if (error) { console.error('Yeni bildirim çekilemedi:', error); return; }
          if (data) setNotifications((n) => [data as unknown as NotificationRow, ...n]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const markAllRead = async () => {
    if (!profile) return;
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false);
    if (error) { console.error('Okundu işaretlenemedi:', error); return; }
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  };

  const markRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) { console.error('Okundu işaretlenemedi:', error); return; }
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));
  };

  const goToActor = (n: NotificationRow) => {
    if (!n.read) markRead(n.id);
    if (n.actor_id) navigate({ name: 'profile', userId: n.actor_id });
  };

  const goToContent = (n: NotificationRow) => {
    if (!n.read) markRead(n.id);
    if (n.post_id) {
      navigate({ name: 'post', postId: n.post_id });
    } else if (n.reel_id) {
      navigate({ name: 'reels' });
    } else if (n.actor_id) {
      navigate({ name: 'profile', userId: n.actor_id });
    }
  };

  const iconFor = (type: string) => {
    if (type === 'like') return <Heart size={16} className="text-rose-500" fill="currentColor" />;
    if (type === 'follow') return <UserPlus size={16} className="text-[var(--ig-accent)]" />;
    if (type === 'comment') return <MessageCircle size={16} className="text-sky-500" />;
    if (type === 'message') return <Send size={16} className="text-sky-500" />;
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

      {visibleNotifications.length === 0 ? (
        <div className="py-20 text-center">
          <Heart size={48} className="mx-auto text-[var(--ig-muted)]" />
          <p className="mt-3 text-sm text-[var(--ig-muted)]">Henüz bildirim yok</p>
        </div>
      ) : (
        <div className="space-y-1">
          {visibleNotifications.map((n) => {
            const thumb = n.post?.media_urls?.[0] || n.reel?.video_url;
            const isVideo = !!thumb && /\.(mp4|webm|mov)(\?|$)/i.test(thumb);
            return (
              <div
                key={n.id}
                className={`flex w-full items-center gap-3 rounded-lg p-3 transition hover:bg-gray-100 dark:hover:bg-zinc-900 ${!n.read ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
              >
                {/* Avatar / isim -> her zaman bildirimi gönderen kişinin profiline gider */}
                <button onClick={() => goToActor(n)} className="relative shrink-0">
                  <Avatar profile={n.actor || { avatar_url: null, username: '', full_name: '' }} size={44} />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ig-surface)] ring-2 ring-[var(--ig-surface)]">
                    {iconFor(n.type)}
                  </span>
                </button>

                {/* Metin ve önizleme -> ilgili gönderiye/reels'e gider (varsa) */}
                <button onClick={() => goToContent(n)} className="flex flex-1 items-center gap-3 text-left">
                  <div className="flex-1">
                    <p className="text-sm">
                      <button
                        onClick={(e) => { e.stopPropagation(); goToActor(n); }}
                        className="font-semibold hover:underline"
                      >
                        {n.actor?.username}
                      </button>{' '}
                      {n.text}
                    </p>
                    <p className="text-xs text-[var(--ig-muted)]">{timeAgo(n.created_at)}</p>
                  </div>
                  {thumb && (
                    isVideo ? (
                      <video src={thumb} className="h-11 w-11 shrink-0 rounded object-cover" />
                    ) : (
                      <img src={thumb} alt="" className="h-11 w-11 shrink-0 rounded object-cover" />
                    )
                  )}
                </button>

                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--ig-accent)]" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
