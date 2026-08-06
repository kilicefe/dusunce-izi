import React from 'react';
import { NavTab } from './Sidebar';
import { getClassrooms, getStudentRoster } from '../lib/db';
import { Users, FileText, Brain, Sparkles, ArrowRight, CheckCircle2, QrCode, ShieldCheck } from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const classrooms = getClassrooms();
  let totalStudents = 0;
  classrooms.forEach((c) => {
    totalStudents += getStudentRoster(c.id).length;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <Brain className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 rounded-full text-xs font-medium text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Faz 1: Mimari & Sınıf/Kadro Altyapısı</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Yapay Zekâ Destekli Düşünme Analizi Sistemine Hoş Geldiniz
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            DÜŞÜNCE İZİ, açık uçlu fen ve matematik sorularında öğrencilerin kavramsal anlama, kavram yanılgısı ve üst düzey düşünme becerilerini çok modlu (yazı, resim, ses) analiz eden öğretmen karar destek sistemidir.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('new-exam')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-2"
            >
              <span>Yeni Sınav Hazırla</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('classrooms')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Sınıf ve Öğrenci Listeleri</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Toplam Sınıf</span>
            <div className="p-2.5 bg-indigo-950 text-indigo-400 rounded-xl border border-indigo-800">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{classrooms.length}</div>
          <p className="text-xs text-slate-400">Tanımlanmış aktif şube</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kayıtlı Öğrenci</span>
            <div className="p-2.5 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{totalStudents}</div>
          <p className="text-xs text-slate-400">Okul no ile eşleşen öğrenci</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Yayınlanan Sınav</span>
            <div className="p-2.5 bg-purple-950 text-purple-400 rounded-xl border border-purple-800">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">1</div>
          <p className="text-xs text-slate-400">Aktif açık uçlu sınav</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gizlilik Koruması</span>
            <div className="p-2.5 bg-blue-950 text-blue-400 rounded-xl border border-blue-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg font-bold text-emerald-400">Aktif & Anonim</div>
          <p className="text-xs text-slate-400">Kişisel veriler YZ’ye gönderilmez</p>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classrooms summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Sınıflarım ve Öğrenci Listeleri
            </h3>
            <button
              onClick={() => onNavigate('classrooms')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {classrooms.map((cls) => {
              const rosterCount = getStudentRoster(cls.id).length;
              return (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-4 bg-slate-800/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-slate-100 text-sm">{cls.name}</h4>
                    <p className="text-xs text-slate-400">
                      Sınıf: {cls.grade} | Akademik Yıl: {cls.academicYear}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {rosterCount} Öğrenci
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Guide */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <QrCode className="w-5 h-5 text-purple-400" />
            Öğrenci Sınav Katılım Akışı
          </h3>

          <ol className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0">1</span>
              <div>
                <span className="font-semibold text-white">Sınav ve Bağlantı Oluşturma:</span> Öğretmen açık uçlu soruyu ve kabul edilen yanıt türlerini (yazı, resim, ses) tanımlar.
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0">2</span>
              <div>
                <span className="font-semibold text-white">Sadece Okul Numarası ile Giriş:</span> Öğrenci şifre veya e-posta olmadan benzersiz bağlantıyı açar ve sadece okul numarasını girer.
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0">3</span>
              <div>
                <span className="font-semibold text-white">Çok Modlu Yanıt Gönderimi:</span> Öğrenci direkt yazar, el yazısı fotoğrafını yükler veya sesli anlatım kaydeder.
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0">4</span>
              <div>
                <span className="font-semibold text-white">YZ Analizi ve Öğretmen Onayı:</span> YZ nitel analizi (kavramlar, yanılgılar, HOTS) oluşturur; öğretmen inceler, düzeltir ve onaylar.
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
