'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-xl font-bold text-red-400">Bir Hata Oluştu</h2>
        <p className="text-sm text-slate-400">
          {error.message || 'Sistemde beklenmeyen bir hata meydana geldi.'}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            Yeniden Dene
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            Gösterge Paneline Dön
          </a>
        </div>
      </div>
    </div>
  );
}
