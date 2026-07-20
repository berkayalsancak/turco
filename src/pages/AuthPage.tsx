import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, username, fullName);
    setLoading(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ig-bg)] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="ig-card mb-4 p-8">
          <h1 className="mb-6 text-center text-4xl font-bold ig-gradient-text">SosyalAğı</h1>
          <p className="mb-6 text-center text-sm text-[var(--ig-muted)]">
            {mode === 'signin' ? 'Hesabına giriş yap' : 'Yeni hesap oluştur'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <>
                <input
                  className="ig-input"
                  placeholder="Kullanıcı adı"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                />
                <input
                  className="ig-input"
                  placeholder="Ad Soyad"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </>
            )}
            <input
              className="ig-input"
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="ig-input"
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <button type="submit" disabled={loading} className="ig-btn mt-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>
        </div>

        <div className="ig-card p-5 text-center text-sm">
          {mode === 'signin' ? 'Hesabın yok mu?' : 'Hesabın var mı?'}{' '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
            className="font-semibold text-[var(--ig-accent)] hover:underline"
          >
            {mode === 'signin' ? 'Kayıt ol' : 'Giriş yap'}
          </button>
        </div>
      </div>
    </div>
  );
}
