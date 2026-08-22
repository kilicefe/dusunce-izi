import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  exam: { findUnique: vi.fn() },
  studentResponse: { findMany: vi.fn() },
}));
const requireTeacherMock = vi.hoisted(() => vi.fn());

vi.mock('../lib/prisma', () => ({ default: prismaMock }));
vi.mock('../lib/auth', () => ({ requireTeacher: requireTeacherMock }));

import { getExamReviewList } from '../app/actions/multimodalActions';

describe('teacher experience regressions', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://test.invalid/database';
    vi.clearAllMocks();
    requireTeacherMock.mockResolvedValue({ id: 'teacher-1', role: 'TEACHER' });
    prismaMock.exam.findUnique.mockResolvedValue({ id: 'exam-1', teacherId: 'teacher-1' });
    prismaMock.studentResponse.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it('does not expose an in-progress student answer in the teacher review queue', async () => {
    await getExamReviewList('exam-1');

    const query = prismaMock.studentResponse.findMany.mock.calls[0][0];
    const statuses = query.where.attempt.status.in;

    expect(statuses).toContain('SUBMITTED');
    expect(statuses).toContain('NEEDS_TEACHER_REVIEW');
    expect(statuses).not.toContain('DRAFT');
    expect(statuses).not.toContain('IN_PROGRESS');
  });
});
