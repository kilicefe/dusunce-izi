import { Role } from '@prisma/client';
import { LogOut, School } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { TeacherNavigation } from './TeacherNavigation';

export async function TeacherShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  const isAdmin = user.role === Role.ADMIN;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            aria-label="Düşünce İzi ana sayfa"
            className="flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <School aria-hidden="true" className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-extrabold leading-none tracking-tight text-white">DÜŞÜNCE İZİ</span>
              <span className="text-[11px] text-slate-400">Pedagojik Analiz Platformu</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden text-right sm:block">
              <span className="block max-w-48 truncate text-sm font-semibold text-slate-200">
                {user.name || user.email}
              </span>
              <span
                className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isAdmin
                    ? 'border-amber-500/30 bg-amber-500/20 text-amber-300'
                    : 'border-indigo-500/30 bg-indigo-500/20 text-indigo-300'
                }`}
              >
                {isAdmin ? 'Sistem Yöneticisi' : 'Öğretmen'}
              </span>
            </div>

            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/sign-in' });
              }}
            >
              <button
                type="submit"
                aria-label="Oturumu kapat"
                title="Oturumu Kapat"
                className="rounded-lg bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <LogOut aria-hidden="true" className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:gap-8 lg:px-8 lg:py-8">
        <aside className="w-full shrink-0 lg:w-64">
          <TeacherNavigation isAdmin={isAdmin} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
