import { requireTeacher } from '@/lib/auth';
import { listClassrooms } from '@/app/actions/classroomActions';
import Link from 'next/link';
import { Users, Plus, CheckCircle2, Info, ArrowRight, BookOpen, Eye, BarChart2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const teacher = await requireTeacher();
  const classrooms = await listClassrooms();

  const totalStudents = classrooms.reduce((acc, c) => acc + (c._count?.roster || 0), 0);
  const activeClassrooms = classrooms.filter((c) => c.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Hoş Geldiniz, {teacher.name || teacher.email}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Düşünce İzi Sistem Modülleri (Sprint 6.1 & 6.2) — Sınıf Yönetimi, Sınav Portalı, Multimodal AI Analiz ve Pedagojik İnceleme Arayüzü Etkin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/exams"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition"
          >
            <BookOpen className="w-4 h-4" />
            Sınav Yönetimi
          </Link>
          <Link
            href="/classrooms/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Yeni Sınıf Ekle
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Aktif Sınıflar</span>
            <span className="text-2xl font-extrabold text-slate-900">{activeClassrooms.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Kayıtlı Öğrenciler</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalStudents}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Açık Uçlu Sınav Portalı</span>
            <span className="text-sm font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
              Çoklu Mod Aktif
            </span>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Sınav Yönetimi</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Fen Bilimleri açık uçlu sınavları oluşturun, beklenen kavramları ve kavram yanılgılarını tanımlayın.
          </p>
          <Link
            href="/dashboard/exams"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 pt-1"
          >
            Sınav Modülüne Git <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Yapay Zeka & Öğretmen Onay Alanı</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Metin, el yazısı OCR ve ses çözümlemelerinden elde edilen AI analizlerini inceleyin ve onaylayın.
          </p>
          <Link
            href="/dashboard/exams"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 pt-1"
          >
            İnceleme Arayüzüne Git <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Pedagojik Analiz & Dışa Aktarım</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Kavramsal anlama seviyeleri (0-4), HOTS beceri dağılımı ve CSV/Soru Bankası raporlama araçları.
          </p>
          <Link
            href="/dashboard/exams"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-800 pt-1"
          >
            Raporları İncele <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Classroom List Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Sınıflarınız</h2>
          <Link href="/classrooms" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeClassrooms.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">Henüz aktif bir sınıfınız yok</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Öğrencilerinizi kaydetmek ve sınav tanımlamak için yeni bir sınıf oluşturun.
            </p>
            <Link
              href="/classrooms/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" /> Sınıf Oluştur
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeClassrooms.map((c) => (
              <div key={c.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <h3 className="font-bold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.grade}. Sınıf {c.branch ? `(${c.branch} Şubesi)` : ''} — Akademik Yıl: {c.academicYear}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                    {c._count?.roster || 0} Öğrenci
                  </span>
                  <Link
                    href={`/classrooms/${c.id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                  >
                    Yönet / Detay
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
