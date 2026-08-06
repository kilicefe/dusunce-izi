import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import { School, Users, ShieldAlert, LogOut, LayoutDashboard, FileText } from 'lucide-react';
import { signOut } from '@/lib/auth';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
              <School className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg block leading-none text-white">DÜŞÜNCE İZİ</span>
              <span className="text-[11px] text-slate-400">Pedagojik Analiz Platformu</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-sm font-semibold block text-slate-200">{user.name || user.email}</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                user.role === Role.ADMIN ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}>
                {user.role === Role.ADMIN ? 'Sistem Yöneticisi' : 'Öğretmen'}
              </span>
            </div>

            <form action={async () => {
              'use server';
              await signOut({ redirectTo: '/sign-in' });
            }}>
              <button
                type="submit"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Oturumu Kapat"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          <nav className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <LayoutDashboard className="w-5 h-5 text-indigo-600" />
              Gösterge Paneli
            </Link>

            <Link
              href="/classrooms"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <Users className="w-5 h-5 text-indigo-600" />
              Sınıflarım ve Öğrenciler
            </Link>

            <Link
              href="/dashboard/exams"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <FileText className="w-5 h-5 text-slate-400" />
              Sınavlar (Sprint 6.2+)
            </Link>

            {user.role === Role.ADMIN && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-amber-800 hover:bg-amber-50 transition border border-amber-200/60 mt-4"
              >
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                Sistem Yönetim Paneli
              </Link>
            )}
          </nav>
        </aside>

        {/* Main Content View */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
