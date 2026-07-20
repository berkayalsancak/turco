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

export function RouterProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<Route[]>([{ name: 'home' }]);

  const navigate = (route: Route) => {
    setHistory((h) => [...h, route]);
  };

  const back = () => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [history]);

  return (
    <RouterContext.Provider value={{ route: history[history.length - 1], navigate, back }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
