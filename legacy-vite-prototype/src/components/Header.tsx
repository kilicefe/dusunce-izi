import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/database';
import { Brain, LogOut, UserCheck, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuthModal }) => {
  const { user, isTeacher, isAdmin, logout } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white">DÜŞÜNCE İZİ</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-950 text-indigo-300 border border-indigo-800">
                <Sparkles className="w-3 h-3 mr-1 text-indigo-400" /> YZ Analizi
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Yapay Zekâ Destekli Çok Modlu Açık Uçlu Değerlendirme ve Öğrenci Düşünme Analizi
            </p>
          </div>
        </div>

        {/* User / Auth Info */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                {user.image ? (
                  <img src={user.image} alt={user.name} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-indigo-400 flex items-center gap-1">
                    {isAdmin ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Sistem Yöneticisi
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3 h-3 text-indigo-400" /> Öğretmen
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Çıkış Yap"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" /> Öğretmen / Yönetici Girişi
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
