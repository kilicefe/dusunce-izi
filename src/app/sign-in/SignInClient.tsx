'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { LogIn, School, ShieldCheck } from 'lucide-react';

type Props = {
  googleAuthConfigured: boolean;
  testAuthEnabled: boolean;
};

export default function SignInClient({ googleAuthConfigured, testAuthEnabled }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!testAuthEnabled) return;

    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (result?.error) {
        setError('Test kullanıcı bilgileri doğrulanamadı.');
        return;
      }
      window.location.href = '/dashboard';
    } catch {
      setError('Giriş sırasında beklenmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/20">
            <School className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">DÜŞÜNCE İZİ</h1>
          <p className="mt-2 text-sm text-slate-400">Öğretmen ve yönetici giriş portalı</p>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          {error ? (
            <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {googleAuthConfigured ? (
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Google ile giriş yap
            </button>
          ) : null}

          {!googleAuthConfigured && !testAuthEnabled ? (
            <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              Giriş sağlayıcısı henüz yapılandırılmadı. Sistem yöneticisi Google OAuth veya geliştirme test girişini etkinleştirmelidir.
            </div>
          ) : null}

          {testAuthEnabled ? (
            <>
              {googleAuthConfigured ? (
                <div className="my-6 flex items-center gap-3 text-xs uppercase text-slate-500">
                  <span className="h-px flex-1 bg-slate-700" />
                  Test girişi
                  <span className="h-px flex-1 bg-slate-700" />
                </div>
              ) : null}

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1 block text-xs font-semibold text-slate-300">E-posta</label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="mb-1 block text-xs font-semibold text-slate-300">Test parolası</label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  {loading ? 'Giriş yapılıyor…' : 'Test oturumu aç'}
                </button>
              </form>

              <p className="mt-5 flex items-start gap-2 text-xs text-slate-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                Bu bölüm yalnızca açıkça etkinleştirilen geliştirme ve otomatik test ortamlarında görünür.
              </p>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
