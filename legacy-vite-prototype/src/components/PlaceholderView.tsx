import React from 'react';
import { NavTab } from './Sidebar';
import { Sparkles, FileText, PlusCircle, MessageSquareText, BarChart3, Settings } from 'lucide-react';

interface PlaceholderViewProps {
  tab: NavTab;
  onNavigate: (tab: NavTab) => void;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ tab, onNavigate }) => {
  const configs: Record<NavTab, { title: string; desc: string; icon: React.ReactNode; phase: string }> = {
    dashboard: {
      title: 'Kontrol Paneli',
      desc: 'Genel bakış ve metrikler.',
      icon: <Sparkles className="w-8 h-8 text-indigo-400" />,
      phase: 'Faz 1',
    },
    classrooms: {
      title: 'Sınıflarım',
      desc: 'Sınıf ve öğrenci yönetimi.',
      icon: <Sparkles className="w-8 h-8 text-indigo-400" />,
      phase: 'Faz 1',
    },
    exams: {
      title: 'Sınavlarım',
      desc: 'Oluşturulmuş ve yayınlanmış açık uçlu sınavların listesi.',
      icon: <FileText className="w-8 h-8 text-purple-400" />,
      phase: 'Faz 2 Hazırlığı',
    },
    'new-exam': {
      title: 'Yeni Sınav Oluştur (4 Adımlı Sınav Oluşturucu)',
      desc: 'Soru tanımı, kabul edilen yanıt modları, puanlama anahtarı ve yayınlama.',
      icon: <PlusCircle className="w-8 h-8 text-indigo-400" />,
      phase: 'Faz 2 Hazırlığı',
    },
    responses: {
      title: 'Öğrenci Yanıtları (Soru / Öğrenci / İnceleme Kuyruğu)',
      desc: 'Toplanan el yazısı, sesli anlatım ve direkt metin yanıtlarının listesi.',
      icon: <MessageSquareText className="w-8 h-8 text-emerald-400" />,
      phase: 'Faz 3 Hazırlığı',
    },
    analyses: {
      title: 'Düşünme Analizleri ve Raporlama',
      desc: 'Kavramsal anlama, kavram yanılgıları ve HOTS (Üst Düzey Düşünme) raporları.',
      icon: <BarChart3 className="w-8 h-8 text-blue-400" />,
      phase: 'Faz 4 Hazırlığı',
    },
    reviews: {
      title: 'AI Öğretmen İnceleme Havuzu',
      desc: 'Yapay zekâ tarafından analiz edilmiş yanıtların öğretmen onayı ve düzenleme ekranı.',
      icon: <Sparkles className="w-8 h-8 text-indigo-400" />,
      phase: 'Faz 4',
    },
    'admin-processing': {
      title: 'İşleme Tanıları & Arka Plan Kuyruğu',
      desc: 'Yapay zekâ OCR, transkripsiyon ve nitel analiz arka plan işlerinin durumu ve tanıları.',
      icon: <Sparkles className="w-8 h-8 text-amber-400" />,
      phase: 'Faz 4',
    },
    settings: {
      title: 'Sistem ve YZ Model Ayarları',
      desc: 'Gemini model parametreleri, gizlilik tercihleri ve veri saklama süreleri.',
      icon: <Settings className="w-8 h-8 text-slate-400" />,
      phase: 'Faz 1',
    },
  };

  const current = configs[tab] || configs.dashboard;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 max-w-2xl mx-auto my-8 shadow-md">
      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto border border-slate-700">
        {current.icon}
      </div>
      <span className="inline-block px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full text-xs font-semibold">
        {current.phase}
      </span>
      <h3 className="text-xl font-bold text-white">{current.title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{current.desc}</p>
      <div className="pt-4 flex justify-center gap-3">
        <button
          onClick={() => onNavigate('classrooms')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all"
        >
          Sınıf & Kadro Yönetimine Dön
        </button>
      </div>
    </div>
  );
};
