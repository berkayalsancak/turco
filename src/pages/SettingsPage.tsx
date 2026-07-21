import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { Avatar } from '../components/Avatar';
import { Moon, Sun, Bell, Lock, User, LogOut, ChevronRight, X, Ban, Check, Loader2 } from 'lucide-react';

type Panel = 'account' | 'privacy' | 'notifications' | null;

export function SettingsPage() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));
  const [panel, setPanel] = useState<Panel>(null);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  const sections: { key: Panel; icon: typeof User; label: string; desc: string }[] = [
    { key: 'account', icon: User, label: 'Hesap', desc: 'Hesap bilgilerini düzenle' },
    { key: 'privacy', icon: Lock, label: 'Gizlilik', desc: 'Hesap gizliliği ve engellemeler' },
    { key: 'notifications', icon: Bell, label: 'Bildirimler', desc: 'Bildirim tercihleri' },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h2 className="mb-6 text-xl font-semibold">Ayarlar</h2>

      <div className="ig-card mb-4 divide-y">
        <button onClick={toggleDark} className="flex w-full items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-zinc-900">
          {dark ? <Moon size={20} /> : <Sun size={20} />}
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">{dark ? 'Koyu Tema' : 'Açık Tema'}</p>
            <p className="text-xs text-[var(--ig-muted)]">Görünümü değiştir</p>
          </div>
          <span className={`relative h-6 w-11 rounded-full transition ${dark ? 'bg-[var(--ig-accent)]' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${dark ? 'left-[22px]' : 'left-0.5'}`} />
          </span>
        </button>

        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.label} onClick={() => setPanel(s.key)} className="flex w-full items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-zinc-900">
              <Icon size={20} />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-[var(--ig-muted)]">{s.desc}</p>
              </div>
              <ChevronRight size={18} className="text-[var(--ig-muted)]" />
            </button>
          );
        })}
      </div>

      {profile?.is_admin && (
        <button onClick={() => navigate({ name: 'admin' })} className="ig-card mb-4 flex w-full items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-zinc-900">
          <span className="text-2xl">🛡️</span>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Admin Paneli</p>
            <p className="text-xs text-[var(--ig-muted)]">Yönetici araçları</p>
          </div>
          <ChevronRight size={18} className="text-[var(--ig-muted)]" />
        </button>
      )}

      <button onClick={signOut} className="ig-card flex w-full items-center gap-3 p-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30">
        <LogOut size={20} />
        <span className="text-sm font-medium">Çıkış Yap</span>
      </button>

      {panel === 'account' && profile && (
        <AccountPanel profile={profile} onClose={() => setPanel(null)} onSaved={refreshProfile} />
      )}
      {panel === 'privacy' && profile && (
        <PrivacyPanel profile={profile} onClose={() => setPanel(null)} onSaved={refreshProfile} />
      )}
      {panel === 'notifications' && (
        <NotificationsPanel onClose={() => setPanel(null)} />
      )}
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="ig-card w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function AccountPanel({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: () => Promise<void> }) {
  const [username, setUsername] = useState(profile.username);
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ username, full_name: fullName })
      .eq('id', profile.id);
    if (profileErr) { setError(profileErr.message); setSaving(false); return; }

    if (newPassword.trim()) {
      const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword });
      if (pwErr) { setError(pwErr.message); setSaving(false); return; }
    }

    await onSaved();
    setSaving(false);
    setSuccess(true);
    setNewPassword('');
  };

  return (
    <ModalShell title="Hesap" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--ig-muted)]">Kullanıcı adı</label>
          <input className="ig-input" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--ig-muted)]">Ad Soyad</label>
          <input className="ig-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--ig-muted)]">Yeni şifre (opsiyonel)</label>
          <input className="ig-input" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-rose-500">{error}</p>}
        {success && <p className="text-sm text-emerald-500">Kaydedildi.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="ig-btn-secondary">Kapat</button>
          <button onClick={save} disabled={saving} className="ig-btn">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Kaydet
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function PrivacyPanel({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: () => Promise<void> }) {
  const [isPrivate, setIsPrivate] = useState(profile.is_private);
  const [blocked, setBlocked] = useState<{ id: string; blocked: Profile }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('blocks')
      .select('id, blocked:profiles!blocked_id(*)')
      .eq('blocker_id', profile.id)
      .then(({ data }) => {
        setBlocked((data as any) || []);
        setLoading(false);
      });
  }, [profile.id]);

  const togglePrivate = async () => {
    const next = !isPrivate;
    setIsPrivate(next);
    setSaving(true);
    await supabase.from('profiles').update({ is_private: next }).eq('id', profile.id);
    await onSaved();
    setSaving(false);
  };

  const unblock = async (blockId: string, blockedId: string) => {
    await supabase.from('blocks').delete().eq('id', blockId);
    setBlocked((b) => b.filter((x) => x.id !== blockId));
  };

  return (
    <ModalShell title="Gizlilik" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Gizli Hesap</p>
            <p className="text-xs text-[var(--ig-muted)]">Sadece onayladığın kişiler gönderilerini görebilir</p>
          </div>
          <button
            onClick={togglePrivate}
            disabled={saving}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${isPrivate ? 'bg-[var(--ig-accent)]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${isPrivate ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Engellenen Hesaplar</p>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-[var(--ig-muted)]" /></div>
          ) : blocked.length === 0 ? (
            <p className="text-xs text-[var(--ig-muted)]">Engellenen hesap yok</p>
          ) : (
            <div className="space-y-2">
              {blocked.map((b) => (
                <div key={b.id} className="flex items-center gap-2">
                  <Avatar profile={b.blocked} size={32} />
                  <p className="flex-1 text-sm">{b.blocked.username}</p>
                  <button onClick={() => unblock(b.id, b.blocked.id)} className="flex items-center gap-1 text-xs font-semibold text-rose-500">
                    <Ban size={14} /> Kaldır
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="ig-btn-secondary">Kapat</button>
        </div>
      </div>
    </ModalShell>
  );
}

const NOTIF_PREF_KEY = 'sosyalagi_notification_prefs';

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState({ likes: true, comments: true, follows: true, messages: true });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_PREF_KEY);
      if (raw) setPrefs(JSON.parse(raw));
    } catch {
      // yoksay
    }
  }, []);

  const toggle = (key: keyof typeof prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem(NOTIF_PREF_KEY, JSON.stringify(next));
  };

  const rows: { key: keyof typeof prefs; label: string }[] = [
    { key: 'likes', label: 'Beğeniler' },
    { key: 'comments', label: 'Yorumlar' },
    { key: 'follows', label: 'Yeni takipçiler' },
    { key: 'messages', label: 'Mesajlar' },
  ];

  return (
    <ModalShell title="Bildirimler" onClose={onClose}>
      <p className="mb-3 text-xs text-[var(--ig-muted)]">
        Bu tercihler bu cihazda saklanır; hangi bildirim türlerinin listede gösterileceğini belirler.
      </p>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between">
            <p className="text-sm">{r.label}</p>
            <button
              onClick={() => toggle(r.key)}
              className={`relative h-6 w-11 rounded-full transition ${prefs[r.key] ? 'bg-[var(--ig-accent)]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${prefs[r.key] ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-4">
        <button onClick={onClose} className="ig-btn-secondary">Kapat</button>
      </div>
    </ModalShell>
  );
}
