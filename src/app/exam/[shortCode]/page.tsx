'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, LogIn } from 'lucide-react';
import { loginStudentForExam } from '@/app/actions/studentExamActions';

export default function StudentExamLoginPage({ params }: { params: Promise<{ shortCode: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [shortCode, setShortCode] = useState(resolvedParams.shortCode || '');
  const [schoolNumber, setSchoolNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortCode.trim() || !schoolNumber.trim()) {
      setErrorMsg('Lütfen sınav kodunu ve okul numaranızı giriniz.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const session = await loginStudentForExam(shortCode, schoolNumber);
      router.push(`/exam/${session.shortCode}/take?token=${session.attemptToken}`);
    } catch (err: any) {
      setErrorMsg(err.message?.replace(/^[A-Z_]+:\s*/, '') || 'Giriş yapılamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Öğrenci Sınav Portalı</h1>
          <p className="text-xs text-slate-500">
            Açık uçlu sınav sorularına metin, el yazısı fotoğrafı veya ses kaydı ile yanıt verebilirsiniz.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sınav Kodu *</label>
            <input
              type="text"
              required
              placeholder="ör. 2A4B8C"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value.toUpperCase())}
              className="w-full p-3 border border-slate-200 rounded-xl font-mono text-sm tracking-wider uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Okul Numaranız *</label>
            <input
              type="text"
              required
              placeholder="ör. 104"
              value={schoolNumber}
              onChange={(e) => setSchoolNumber(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? 'Giriş Yapılıyor...' : 'Sınava Başla'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
          Düşünce İzi — Pedagojik Çoklu-Modlu Yanıt Altyapısı
        </div>
      </div>
    </div>
  );
}
