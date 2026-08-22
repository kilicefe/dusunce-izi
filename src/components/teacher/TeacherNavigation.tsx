'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  LayoutDashboard,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react';

type NavigationItem = {
  href: string;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
  exact?: boolean;
  admin?: boolean;
};

const navigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Gösterge Paneli',
    mobileLabel: 'Ana Sayfa',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/classrooms',
    label: 'Sınıflarım ve Öğrenciler',
    mobileLabel: 'Sınıflar',
    icon: Users,
  },
  {
    href: '/dashboard/exams',
    label: 'Sınavlar',
    mobileLabel: 'Sınavlar',
    icon: FileText,
  },
  {
    href: '/admin',
    label: 'Sistem Yönetimi',
    mobileLabel: 'Yönetim',
    icon: ShieldAlert,
    admin: true,
  },
];

export function TeacherNavigation({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname() || '';

  return (
    <nav
      aria-label="Ana menü"
      className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:flex lg:flex-col`}
    >
      {navigationItems
        .filter((item) => !item.admin || isAdmin)
        .map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center text-xs font-semibold transition lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:text-left lg:text-sm ${
                active
                  ? 'bg-indigo-50 text-indigo-800 ring-1 ring-inset ring-indigo-100'
                  : item.admin
                    ? 'text-amber-800 hover:bg-amber-50'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <Icon
                aria-hidden="true"
                className={`h-5 w-5 shrink-0 ${
                  item.admin ? 'text-amber-600' : active ? 'text-indigo-700' : 'text-slate-500'
                }`}
              />
              <span className="lg:hidden">{item.mobileLabel}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}
