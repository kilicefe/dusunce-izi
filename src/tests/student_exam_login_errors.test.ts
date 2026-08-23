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
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock('../lib/prisma', () => ({ default: prismaMock }));
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));

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

  it('refreshes teacher views after a student starts an exam', async () => {
    prismaMock.exam.findFirst.mockResolvedValue({
      id: 'exam-1',
      status: 'PUBLISHED',
      shortCode: 'RYB5N9',
      title: 'Fen Sınavı',
      subject: 'Fen Bilimleri',
      classroom: {
        roster: [
          { id: 'student-1', schoolNumber: '253', firstName: 'Deniz', lastName: 'Örnek' },
        ],
      },
    });
    prismaMock.examAttempt.findUnique.mockResolvedValue(null);
    prismaMock.examAttempt.create.mockResolvedValue({ id: 'attempt-1' });

    await expect(loginStudentForExam('RYB5N9', '253')).resolves.toMatchObject({
      ok: true,
      studentName: 'Deniz Örnek',
    });

    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard/exams');
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard/exams/exam-1/review');
  });
});
