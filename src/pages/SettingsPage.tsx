import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Moon, Sun, Bell, Lock, User, LogOut, ChevronRight } from 'lucide-react';

export function SettingsPage() {
  const { profile, signOut } = useAuth();
  const { navigate } = useRouter();
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  const sections = [
    { icon: User, label: 'Hesap', desc: 'Hesap bilgilerini düzenle' },
    { icon: Lock, label: 'Gizlilik', desc: 'Hesap gizliliği ve engellemeler' },
    { icon: Bell, label: 'Bildirimler', desc: 'Bildirim tercihleri' },
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
            <button key={s.label} className="flex w-full items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-zinc-900">
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
    </div>
  );
}
