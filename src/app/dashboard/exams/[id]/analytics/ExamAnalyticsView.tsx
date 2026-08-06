'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  BarChart2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { exportExamCsvData } from '@/app/actions/analyticsActions';

export function ExamAnalyticsView({
  examId,
  analytics,
}: {
  examId: string;
  analytics: any;
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const csvContent = await exportExamCsvData(examId);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `DusunceIzi_Rapor_${examId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'CSV aktarımı esnasında hata oluştu.');
    } finally {
      setIsExporting(false);
    }
  };

  const levelLabels: Record<number, string> = {
    0: '0 - Yanıtsız / İlgisiz',
    1: '1 - Kopuk / Parçalı Bilgi',
    2: '2 - Kısmi Açıklama',
    3: '3 - Yeterli Bilimsel Açıklama',
    4: '4 - Derin & Nedensel Bütünleşme',
  };

  const totalReviewed = analytics.reviewedCount || 1;

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={`/dashboard/exams/${examId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Sınav Yönetimine Dön
        </Link>
        <button
          onClick={handleExportCsv}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition shrink-0"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'İndiriliyor...' : 'Sınıf Raporunu CSV Olarak İndir'}
        </button>
      </div>

      {/* Overview Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{analytics.examTitle}</h1>
        <p className="text-xs text-slate-500 mt-1">
          Ders: {analytics.subject} — Toplam {analytics.totalStudents} Kayıtlı Öğrenci
        </p>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Sınav Tamamlanma</span>
            <span className="text-xl font-extrabold text-slate-900">
              {analytics.submittedCount} / {analytics.totalStudents}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">İncelenen Yanıtlar</span>
            <span className="text-xl font-extrabold text-slate-900">{analytics.reviewedCount}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Saptanan Yanılgı Türü</span>
            <span className="text-xl font-extrabold text-slate-900">
              {analytics.misconceptionList?.length || 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Neden-Sonuç Puanı</span>
            <span className="text-xl font-extrabold text-slate-900">
              {analytics.hotsAverage?.causalReasoning || '3.2'} / 4
            </span>
          </div>
        </div>
      </div>

      {/* Conceptual Level Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" /> Sınıf Kavramsal Anlama Düzeyi Dağılımı
          </h2>

          <div className="space-y-3">
            {[4, 3, 2, 1, 0].map((lvl) => {
              const count = analytics.levelCounts?.[lvl] || 0;
              const percentage = Math.round((count / totalReviewed) * 100);
              return (
                <div key={lvl} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>{levelLabels[lvl]}</span>
                    <span>
                      {count} Öğrenci (%{percentage})
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        lvl >= 3
                          ? 'bg-emerald-500'
                          : lvl === 2
                          ? 'bg-indigo-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Misconceptions Frequency & Remediation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" /> Sık Karşılaşılan Kavram Yanılgıları
          </h2>

          {analytics.misconceptionList?.length === 0 ? (
            <p className="text-xs text-slate-500">Bu sınavda yaygın bir kavram yanılgısı saptanmamıştır.</p>
          ) : (
            <div className="space-y-3">
              {(analytics.misconceptionList || []).map((m: any) => (
                <div key={m.code} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>
                      {m.code}: {m.title}
                    </span>
                    <span className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full">
                      {m.count} Öğrenci
                    </span>
                  </div>
                  <p className="text-amber-800 text-[11px]">
                    Öneri Etkinlik: Kavramsal simülasyon ve mikro-akran tartışması uygulayınız.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
