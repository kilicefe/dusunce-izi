'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClassroom } from '@/app/actions/classroomActions';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function NewClassroomForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [grade, setGrade] = useState('8');
  const [branch, setBranch] = useState('A');
  const [academicYear, setAcademicYear] = useState('2025-2026');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const created = await createClassroom({
        name,
        grade,
        branch,
        academicYear,
      });

      router.push(`/classrooms/${created.id}`);
    } catch (err: any) {
      setError('Sınıf oluşturulurken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/classrooms" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2">
          <ArrowLeft className="w-4 h-4" /> Sınıf Listesine Dön
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Yeni Sınıf Tanımla</h1>
        <p className="text-sm text-slate-500 mt-0.5">Sınıf adını, düzeyini ve akademik yılını seçerek kaydedin.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Sınıf Adı (Görünür İsim)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: 8-A Fen Bilgisi"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sınıf Düzeyi (Grade)
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="5">5. Sınıf</option>
                <option value="6">6. Sınıf</option>
                <option value="7">7. Sınıf</option>
                <option value="8">8. Sınıf</option>
                <option value="9">9. Sınıf</option>
                <option value="10">10. Sınıf</option>
                <option value="11">11. Sınıf</option>
                <option value="12">12. Sınıf</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Şube (Branch)
              </label>
              <input
                type="text"
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="A, B, C, D..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Akademik Yıl
            </label>
            <input
              type="text"
              required
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link
              href="/classrooms"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              {loading ? 'Kaydediliyor...' : 'Sınıfı Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
