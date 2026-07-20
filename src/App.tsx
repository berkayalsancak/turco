import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { Sidebar, MobileNav, MobileTopBar } from './components/Layout';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { ReelsPage } from './pages/ReelsPage';
import { MessagesPage } from './pages/MessagesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { PostDetailPage } from './pages/PostDetailPage';
import { CreatePage } from './pages/CreatePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { session, loading } = useAuth();
  const { route } = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--ig-muted)]" />
      </div>
    );
  }

  if (!session) return <AuthPage />;

  const isReels = route.name === 'reels';
  const isMessages = route.name === 'messages';

  return (
    <div className="min-h-screen bg-[var(--ig-bg)]">
      <Sidebar />
      <MobileTopBar />
      <main className={`md:ml-64 lg:ml-72 ${isReels ? '' : 'pb-14 md:pb-0'}`}>
        {route.name === 'home' && <HomePage />}
        {route.name === 'explore' && <ExplorePage />}
        {route.name === 'search' && <ExplorePage />}
        {route.name === 'reels' && <ReelsPage />}
        {route.name === 'messages' && <MessagesPage />}
        {route.name === 'notifications' && <NotificationsPage />}
        {route.name === 'profile' && <ProfilePage userId={route.userId} />}
        {route.name === 'post' && <PostDetailPage postId={route.postId} />}
        {route.name === 'create' && <CreatePage type={route.type} />}
        {route.name === 'settings' && <SettingsPage />}
        {route.name === 'admin' && <AdminPage />}
      </main>
      {!isReels && !isMessages && <MobileNav />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}
