import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  PlusCircle,
  MessageSquareText,
  BarChart3,
  Settings,
  HelpCircle,
  Sparkles,
  Cpu,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'classrooms' | 'exams' | 'new-exam' | 'responses' | 'reviews' | 'admin-processing' | 'analyses' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'dashboard', label: 'Kontrol Paneli', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'classrooms', label: 'Sınıflarım', icon: <Users className="w-5 h-5" /> },
    { id: 'exams', label: 'Sınavlarım', icon: <FileText className="w-5 h-5" />, badge: '1' },
    { id: 'new-exam', label: 'Yeni Sınav Oluştur', icon: <PlusCircle className="w-5 h-5" /> },
    { id: 'responses', label: 'Öğrenci Yanıtları', icon: <MessageSquareText className="w-5 h-5" /> },
    { id: 'reviews', label: 'AI İnceleme Havuzu', icon: <Sparkles className="w-5 h-5 text-indigo-400" /> },
    { id: 'admin-processing', label: 'İşleme Tanıları', icon: <Cpu className="w-5 h-5 text-amber-400" /> },
    { id: 'analyses', label: 'Düşünme Analizleri', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: 'Sistem Ayarları', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 shrink-0 flex flex-col justify-between py-4 min-h-[calc(100vh-4rem)] text-slate-300">
      <div className="space-y-1 px-3">
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Öğretmen Menüsü
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-indigo-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-4 py-3 mx-3 bg-slate-800/50 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center space-x-2 text-slate-300 font-medium text-xs">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span>Gizlilik İlkesi</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Öğrenci kişisel verileri (ad, soyad, okul no) yapay zekâ servislerine <strong>asla gönderilmez</strong>.
        </p>
      </div>
    </aside>
  );
};
