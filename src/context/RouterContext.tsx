import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'reels' }
  | { name: 'explore' }
  | { name: 'messages' }
  | { name: 'notifications' }
  | { name: 'search'; query?: string }
  | { name: 'profile'; userId: string }
  | { name: 'post'; postId: string }
  | { name: 'create'; type: 'post' | 'story' | 'reel' }
  | { name: 'settings' }
  | { name: 'admin' };

interface RouterContextValue {
  route: Route;
  navigate: (route: Route) => void;
  back: () => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

// Route <-> URL çevirimi. Tarayıcının gerçek geçmişiyle (back/forward tuşu)
// senkron kalabilmemiz için her route bir URL'e karşılık gelir.
function routeToPath(route: Route): string {
  switch (route.name) {
    case 'home':
      return '/';
    case 'reels':
      return '/reels';
    case 'explore':
      return '/explore';
    case 'messages':
      return '/messages';
    case 'notifications':
      return '/notifications';
    case 'search':
      return route.query ? `/search?q=${encodeURIComponent(route.query)}` : '/search';
    case 'profile':
      return `/profile/${route.userId}`;
    case 'post':
      return `/post/${route.postId}`;
    case 'create':
      return `/create/${route.type}`;
    case 'settings':
      return '/settings';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
}

function pathToRoute(pathname: string, search: string): Route {
  const parts = pathname.split('/').filter(Boolean);
  const params = new URLSearchParams(search);

  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'reels') return { name: 'reels' };
  if (parts[0] === 'explore') return { name: 'explore' };
  if (parts[0] === 'messages') return { name: 'messages' };
  if (parts[0] === 'notifications') return { name: 'notifications' };
  if (parts[0] === 'search') return { name: 'search', query: params.get('q') || undefined };
  if (parts[0] === 'profile' && parts[1]) return { name: 'profile', userId: parts[1] };
  if (parts[0] === 'post' && parts[1]) return { name: 'post', postId: parts[1] };
  if (parts[0] === 'create' && (parts[1] === 'post' || parts[1] === 'story' || parts[1] === 'reel')) {
    return { name: 'create', type: parts[1] };
  }
  if (parts[0] === 'settings') return { name: 'settings' };
  if (parts[0] === 'admin') return { name: 'admin' };
  return { name: 'home' };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => pathToRoute(window.location.pathname, window.location.search));

  useEffect(() => {
    // İlk history kaydına state olarak route'u yaz, geri gidince kaybolmasın.
    window.history.replaceState({ route }, '', routeToPath(route));

    const onPopState = (e: PopStateEvent) => {
      const r: Route = (e.state && e.state.route) || pathToRoute(window.location.pathname, window.location.search);
      setRoute(r);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const navigate = (next: Route) => {
    setRoute(next);
    window.history.pushState({ route: next }, '', routeToPath(next));
  };

  // Tarayıcının kendi "geri" mekanizmasını tetikler; sonuç popstate ile gelir.
  const back = () => {
    window.history.back();
  };

  return <RouterContext.Provider value={{ route, navigate, back }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
