import { listClassrooms } from '@/app/actions/classroomActions';
import Link from 'next/link';
import { Users, Plus, Archive, RefreshCw, FolderArchive, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClassroomsListPage() {
  const classrooms = await listClassrooms();

  const activeClassrooms = classrooms.filter((c) => c.status === 'ACTIVE');
  const archivedClassrooms = classrooms.filter((c) => c.status === 'ARCHIVED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sınıf Yönetimi</h1>
          <p className="text-sm text-slate-500">Sınıflarınızı listeleyin, düzenleyin ve öğrenci kadrolarını yönetin.</p>
        </div>
        <Link
          href="/classrooms/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Yeni Sınıf Ekle
        </Link>
      </div>

      {/* Active Classrooms */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900">Aktif Sınıflar ({activeClassrooms.length})</h2>
          </div>
        </div>

        {activeClassrooms.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Aktif sınıf bulunmuyor. Yeni bir sınıf ekleyerek başlayabilirsiniz.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeClassrooms.map((c) => (
              <div key={c.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                    <span>{c.grade}. Sınıf {c.branch ? `(${c.branch})` : ''}</span>
                    <span>•</span>
                    <span>Akademik Yıl: {c.academicYear}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                    {c._count?.roster || 0} Öğrenci
                  </span>
                  <Link
                    href={`/classrooms/${c.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                  >
                    Detay & Kadro <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archived Classrooms */}
      {archivedClassrooms.length > 0 && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-700">
            <FolderArchive className="w-5 h-5 text-slate-500" />
            <h2 className="font-bold text-sm">Arşivlenmiş Sınıflar ({archivedClassrooms.length})</h2>
          </div>

          <div className="space-y-2">
            {archivedClassrooms.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800">{c.name}</span>
                  <span className="text-slate-500 ml-2">({c.academicYear})</span>
                </div>
                <Link
                  href={`/classrooms/${c.id}`}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Görüntüle
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
