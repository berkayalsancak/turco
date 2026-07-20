import { Home, Search, PlusSquare, Film, MessageCircle, Bell, User, Settings, Shield, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter, type Route } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { avatarColor, initials } from '../lib/utils';

const navItems: { route: Route; label: string; icon: typeof Home }[] = [
  { route: { name: 'home' }, label: 'Ana Sayfa', icon: Home },
  { route: { name: 'search' }, label: 'Arama', icon: Search },
  { route: { name: 'explore' }, label: 'Keşfet', icon: Search },
  { route: { name: 'reels' }, label: 'Reels', icon: Film },
  { route: { name: 'messages' }, label: 'Mesajlar', icon: MessageCircle },
  { route: { name: 'notifications' }, label: 'Bildirimler', icon: Bell },
];

export function Sidebar() {
  const { route, navigate } = useRouter();
  const { profile, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const isActive = (r: Route) => r.name === route.name;

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r bg-[var(--ig-surface)] px-3 py-6 md:flex lg:w-72">
      <div className="mb-8 px-3">
        <h1 className="text-2xl font-bold tracking-tight ig-gradient-text">TURCO</h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route);
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              className={`flex items-center gap-4 rounded-lg px-3 py-2.5 text-base transition hover:bg-gray-100 dark:hover:bg-zinc-900 ${
                active ? 'font-semibold' : 'font-normal'
              }`}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 2} className={active ? 'text-[var(--ig-text)]' : 'text-[var(--ig-text)]'} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => navigate({ name: 'create', type: 'post' })}
          className="flex items-center gap-4 rounded-lg px-3 py-2.5 text-base font-normal transition hover:bg-gray-100 dark:hover:bg-zinc-900"
        >
          <PlusSquare size={24} strokeWidth={2} />
          <span>Oluştur</span>
        </button>

        <button
          onClick={() => profile && navigate({ name: 'profile', userId: profile.id })}
          className="flex items-center gap-4 rounded-lg px-3 py-2.5 text-base font-normal transition hover:bg-gray-100 dark:hover:bg-zinc-900"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${avatarColor(profile?.username || 'SA')} flex items-center justify-center text-xs font-bold text-white`}>
              {initials(profile?.full_name || profile?.username || 'SA')}
            </div>
          )}
          <span>Profil</span>
        </button>
      </nav>

      <div className="relative">
        {showMenu && (
          <div className="absolute bottom-0 left-0 w-56 rounded-xl border bg-[var(--ig-surface)] py-2 shadow-xl animate-scale-in">
            <button onClick={() => { setShowMenu(false); navigate({ name: 'settings' }); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-zinc-900">
              <Settings size={18} /> Ayarlar
            </button>
            {profile?.is_admin && (
              <button onClick={() => { setShowMenu(false); navigate({ name: 'admin' }); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-zinc-900">
                <Shield size={18} /> Admin Paneli
              </button>
            )}
            <hr className="my-1 border-[var(--ig-border)]" />
            <button onClick={() => { setShowMenu(false); signOut(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-zinc-900">
              Çıkış Yap
            </button>
          </div>
        )}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex w-full items-center gap-4 rounded-lg px-3 py-2.5 text-base font-normal transition hover:bg-gray-100 dark:hover:bg-zinc-900"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          <span>Daha fazla</span>
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { route, navigate } = useRouter();
  const { profile } = useAuth();

  const isActive = (name: string) => name === route.name;

  return (
    <nav className="fixed bottom-0 left-0 z-30 flex h-14 w-full items-center justify-around border-t bg-[var(--ig-surface)] md:hidden">
      <button onClick={() => navigate({ name: 'home' })} className="p-2">
        <Home size={26} strokeWidth={isActive('home') ? 2.5 : 2} className={isActive('home') ? 'text-[var(--ig-text)]' : 'text-[var(--ig-text)]'} />
      </button>
      <button onClick={() => navigate({ name: 'search' })} className="p-2">
        <Search size={26} strokeWidth={isActive('search') ? 2.5 : 2} />
      </button>
      <button onClick={() => navigate({ name: 'create', type: 'post' })} className="p-2">
        <PlusSquare size={26} strokeWidth={2} />
      </button>
      <button onClick={() => navigate({ name: 'reels' })} className="p-2">
        <Film size={26} strokeWidth={isActive('reels') ? 2.5 : 2} />
      </button>
      <button onClick={() => profile && navigate({ name: 'profile', userId: profile.id })} className="p-2">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className={`h-7 w-7 rounded-full object-cover ${isActive('profile') ? 'ring-2 ring-[var(--ig-accent)]' : ''}`} />
        ) : (
          <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${avatarColor(profile?.username || 'SA')} flex items-center justify-center text-xs font-bold text-white ${isActive('profile') ? 'ring-2 ring-[var(--ig-accent)]' : ''}`}>
            {initials(profile?.full_name || profile?.username || 'SA')}
          </div>
        )}
      </button>
    </nav>
  );
}

export function MobileTopBar() {
  const { navigate } = useRouter();
  const { profile } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-[var(--ig-surface)] px-4 md:hidden">
      <h1 className="text-xl font-bold ig-gradient-text">SosyalAğı</h1>
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ name: 'notifications' })}>
          <Bell size={24} />
        </button>
        <button onClick={() => navigate({ name: 'messages' })}>
          <MessageCircle size={24} />
        </button>
      </div>
    </header>
  );
}

export function MobileSearchBar({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const { navigate } = useRouter();
  return (
    <div className="fixed inset-0 z-50 bg-[var(--ig-bg)] md:hidden">
      <div className="flex items-center gap-2 border-b p-3">
        <button onClick={onClose}><X size={24} /></button>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && query && navigate({ name: 'search', query })}
          placeholder="Ara"
          className="ig-input"
        />
      </div>
    </div>
  );
}
