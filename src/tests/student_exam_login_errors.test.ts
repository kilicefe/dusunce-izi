import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  exam: {
    findFirst: vi.fn(),
  },
  examAttempt: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../lib/prisma', () => ({ default: prismaMock }));

import { loginStudentForExam } from '../app/actions/studentExamActions';

describe('student exam login errors', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://test.invalid/database';
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it('returns a serializable validation error instead of throwing', async () => {
    await expect(loginStudentForExam('RYB5N9', '')).resolves.toEqual({
      ok: false,
      error: 'Okul numarası girilmelidir',
    });
    expect(prismaMock.exam.findFirst).not.toHaveBeenCalled();
  });

  it('returns a user-facing roster error instead of a redacted server-action error', async () => {
    prismaMock.exam.findFirst.mockResolvedValue({
      status: 'PUBLISHED',
      classroom: { roster: [] },
    });

    await expect(loginStudentForExam('RYB5N9', '990822')).resolves.toEqual({
      ok: false,
      error: 'Bu okul numarasına sahip öğrenci bu sınıfta bulunamadı',
    });
    expect(prismaMock.examAttempt.findUnique).not.toHaveBeenCalled();
  });
});
