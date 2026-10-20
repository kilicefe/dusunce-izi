import { renderToStaticMarkup } from 'react-dom/server';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({ pending: false }));
vi.mock('next/link', () => ({
  default: ({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
  useLinkStatus: () => navigation,
}));

import { TeacherLink } from '../components/teacher/TeacherLink';
import { TeacherPageLoading } from '../components/teacher/TeacherPageLoading';
import DashboardLoading from '../app/dashboard/loading';
import ExamsLoading from '../app/dashboard/exams/loading';
import ClassroomsLoading from '../app/classrooms/loading';

describe('teacher navigation feedback', () => {
  beforeEach(() => { navigation.pending = false; });

  it('preserves the real link, keyboard semantics, target and active-page attributes', () => {
    const html = renderToStaticMarkup(
      <TeacherLink href="/classrooms" target="_blank" aria-current="page" className="rounded-xl">
        Sınıflar
      </TeacherLink>
    );
    expect(html).toContain('href="/classrooms"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('relative rounded-xl');
    expect(html).not.toContain('data-navigation-pending');
    expect(html).not.toContain('Açılıyor');
  });

  it('announces a pending navigation without blocking the link or moving its contents', () => {
    navigation.pending = true;
    const html = renderToStaticMarkup(<TeacherLink href="/classrooms">Sınıflar</TeacherLink>);
    expect(html).toContain('data-navigation-pending="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Açılıyor…');
    expect(html).toContain('pointer-events-none absolute inset-0');
    expect(html).toContain('motion-safe:animate-spin');
    expect(html).not.toContain('aria-disabled');
  });

  it('removes the hint when Next finishes or cancels navigation', () => {
    navigation.pending = true;
    expect(renderToStaticMarkup(<TeacherLink href="/classrooms">Sınıflar</TeacherLink>)).toContain('Açılıyor');
    navigation.pending = false;
    const html = renderToStaticMarkup(<TeacherLink href="/classrooms">Sınıflar</TeacherLink>);
    expect(html).not.toContain('data-navigation-pending');
    expect(html).not.toContain('Açılıyor');
  });

  it('provides accessible, motion-safe skeletons without fake student information', () => {
    const html = renderToStaticMarkup(<TeacherPageLoading label="Sınıf bilgileri yükleniyor…" />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain('Sınıf bilgileri yükleniyor…');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('motion-safe:animate-pulse');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('<input');
  });

  it.each([
    [DashboardLoading, 'Gösterge paneli yükleniyor…'],
    [ExamsLoading, 'Sınav bilgileri yükleniyor…'],
    [ClassroomsLoading, 'Sınıf bilgileri yükleniyor…'],
  ] as const)('renders the route fallback %s', (Loading, label) => {
    expect(renderToStaticMarkup(<Loading />)).toContain(label);
  });
});
