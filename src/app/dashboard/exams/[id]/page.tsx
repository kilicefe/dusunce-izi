import { requireTeacher } from '@/lib/auth';
import { getExam } from '@/app/actions/examActions';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  BarChart2,
  CheckCircle,
  FileText,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireTeacher();
  const resolvedParams = await params;
  const exam: any = await getExam(resolvedParams.id);

  const studentLink = `/exam/${exam.shortCode}`;

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/exams"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Tüm Sınavlara Dön
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/exams/${exam.id}/review`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition"
          >
            <Eye className="w-4 h-4" /> AI İnceleme Arayüzü
          </Link>
          <Link
            href={`/dashboard/exams/${exam.id}/analytics`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            <BarChart2 className="w-4 h-4" /> Pedagojik Analiz
          </Link>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  exam.status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {exam.status === 'PUBLISHED' ? '● EĞİTİME AÇIK / YAYINLANDI' : 'TASLAK'}
              </span>
              <span className="text-xs text-slate-500">
                Oluşturulma: {new Date(exam.createdAt || Date.now()).toLocaleDateString('tr-TR')}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {exam.subject} — {exam.classroom?.name || 'Sınıf'} ({exam.classroom?.grade || ''}. Sınıf)
            </p>
          </div>

          {/* Student Access Code Banner */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-center sm:text-right shrink-0">
            <span className="text-[11px] font-semibold text-indigo-600 block uppercase tracking-wider">
              Öğrenci Sınav Giriş Kodu
            </span>
            <span className="text-2xl font-mono font-black text-indigo-900 tracking-wider">
              {exam.shortCode}
            </span>
            <div className="text-[11px] text-indigo-700 mt-1">
              Öğrenci Giriş Linki: <span className="font-mono underline">{studentLink}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Questions List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Soru ve Pedagojik Ölçüt Detayları
          </h2>
          <span className="text-xs text-slate-500 font-semibold">{exam.questions?.length || 0} Soru</span>
        </div>

        <div className="divide-y divide-slate-100">
          {(exam.questions || []).map((q: any) => (
            <div key={q.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{q.title}</span>
                <span className="text-xs text-slate-500">Maks. Puan: {q.maximumScore}</span>
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {q.questionText}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-900 space-y-1">
                  <span className="font-bold block text-emerald-800">Beklenen Kavramlar:</span>
                  {(q.expectedConcepts || []).map((ec: any) => (
                    <div key={ec.id} className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{ec.conceptName}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-amber-900 space-y-1">
                  <span className="font-bold block text-amber-800">Takip Edilen Kavram Yanılgıları:</span>
                  {(q.misconceptions || []).map((m: any) => (
                    <div key={m.id} className="flex items-start gap-1.5">
                      <span className="font-mono font-bold text-amber-700">{m.code}:</span>
                      <span>{m.title || m.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
