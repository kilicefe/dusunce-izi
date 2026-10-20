import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => vi.fn());
vi.mock('next-auth', () => ({
  default: () => ({ auth: authMock, handlers: {}, signIn: vi.fn(), signOut: vi.fn() }),
}));
vi.mock('@auth/prisma-adapter', () => ({ PrismaAdapter: () => ({}) }));
vi.mock('../lib/prisma', () => ({ default: {} }));

import { getCurrentUser, requireUser, requireTeacher, requireAdmin } from '../lib/auth';

describe('request-scoped authentication guards', () => {
  beforeEach(() => { authMock.mockReset(); });

  it('does not retain a previous user outside an RSC request cache', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'teacher-a', role: 'TEACHER' } });
    authMock.mockResolvedValueOnce({ user: { id: 'teacher-b', role: 'TEACHER' } });
    expect(await getCurrentUser()).toMatchObject({ id: 'teacher-a' });
    expect(await getCurrentUser()).toMatchObject({ id: 'teacher-b' });
    expect(authMock).toHaveBeenCalledTimes(2);
  });

  it('does not retain a session after sign-out', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'teacher-a', role: 'TEACHER' } });
    authMock.mockResolvedValue(null);
    await expect(requireTeacher()).resolves.toMatchObject({ id: 'teacher-a' });
    await expect(requireUser()).rejects.toThrow('UNAUTHORIZED');
    await expect(requireTeacher()).rejects.toThrow('UNAUTHORIZED');
    await expect(requireAdmin()).rejects.toThrow('UNAUTHORIZED');
  });

  it('preserves teacher and administrator role boundaries', async () => {
    authMock.mockResolvedValue({ user: { id: 'teacher-a', role: 'TEACHER' } });
    await expect(requireTeacher()).resolves.toMatchObject({ role: 'TEACHER' });
    await expect(requireAdmin()).rejects.toThrow('FORBIDDEN');
    authMock.mockResolvedValue({ user: { id: 'student-a', role: 'STUDENT' } });
    await expect(requireTeacher()).rejects.toThrow('FORBIDDEN');
    authMock.mockResolvedValue({ user: { id: 'admin-a', role: 'ADMIN' } });
    await expect(requireTeacher()).resolves.toMatchObject({ role: 'ADMIN' });
    await expect(requireAdmin()).resolves.toMatchObject({ role: 'ADMIN' });
  });
});
