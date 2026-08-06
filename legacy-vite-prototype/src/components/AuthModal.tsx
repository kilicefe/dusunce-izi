import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/database';
import { UserCheck, ShieldCheck, Mail, LogIn, X, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginAsRole, loginEmail } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  if (!isOpen) return null;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    loginEmail(emailInput.trim(), nameInput.trim() || undefined);
    onClose();
  };

  const handleQuickLogin = (role: Role) => {
    loginAsRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-400 font-medium">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Öğretmen / Yönetici Portalı
          </div>
          <h3 className="text-xl font-bold text-white">Sisteme Giriş Yapın</h3>
          <p className="text-xs text-slate-400">
            Öğretmen paneline erişmek ve açık uçlu sınavları yönetmek için giriş yapın.
          </p>
        </div>

        {/* Quick Presets for Demo / Evaluation */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Hızlı Giriş Rol Seçenekleri
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickLogin(Role.TEACHER)}
              className="flex items-center space-x-2 p-3 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 rounded-xl text-left transition-all"
            >
              <UserCheck className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Öğretmen</div>
                <div className="text-[10px] text-indigo-300">Dr. Selin Yılmaz</div>
              </div>
            </button>

            <button
              onClick={() => handleQuickLogin(Role.ADMIN)}
              className="flex items-center space-x-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-all"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Yönetici</div>
                <div className="text-[10px] text-slate-400">Ahmet Demir</div>
              </div>
            </button>
          </div>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase font-semibold">veya E-posta ile</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">E-posta Adresi</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="ogretmen@okul.k12.tr"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Ad Soyad (Opsiyonel)</label>
            <input
              type="text"
              placeholder="Örn: Ayşe Kaya"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" /> Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
};
