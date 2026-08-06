'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { LogIn, School, ShieldCheck } from 'lucide-react';

export default function SignInClient() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password: 'dummy_password',
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (res?.error) {
        setError('E-posta adresi veritabanında bulunamadı. Lütfen kayıtlı bir öğretmen veya admin e-postası giriniz.');
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError('Giriş yapılırken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (testEmail: string) => {
    setEmail(testEmail);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-900 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 mb-4">
          <School className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">DÜŞÜNCE İZİ</h2>
        <p className="mt-2 text-sm text-slate-400">Öğretmen ve Yönetici Kimlik Doğrulama Portalı</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 shadow-2xl border border-slate-700/60 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-semibold text-sm transition shadow-sm mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google ile Giriş Yap
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-400">veya e-posta ile</span>
            </div>
          </div>

          {/* Form Credentials */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                E-posta Adresi
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ogretmen@dusunceizi.edu.tr"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Giriş yapılıyor...' : 'Oturum Aç'}
            </button>
          </form>

          {/* Seed Quick Test Options */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <p className="text-xs text-slate-400 font-medium mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Geliştirme / Test Kullanıcıları:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('ogretmen@dusunceizi.edu.tr')}
                className="px-3 py-2 text-xs rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 text-left transition"
              >
                <span className="font-semibold block text-indigo-300">Öğretmen</span>
                <span className="text-[11px] text-slate-400">ogretmen@...</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@dusunceizi.edu.tr')}
                className="px-3 py-2 text-xs rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 text-left transition"
              >
                <span className="font-semibold block text-amber-300">Yönetici</span>
                <span className="text-[11px] text-slate-400">admin@...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
