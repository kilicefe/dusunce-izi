import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  exam: { findUnique: vi.fn(), create: vi.fn() },
  studentResponse: { findMany: vi.fn() },
}));
const requireTeacherMock = vi.hoisted(() => vi.fn());
const createAuditLogMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock('../lib/prisma', () => ({ default: prismaMock }));
vi.mock('../lib/auth', () => ({ requireTeacher: requireTeacherMock }));
vi.mock('../lib/auditLogger', () => ({ createAuditLog: createAuditLogMock }));
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));

import { getExamReviewList } from '../app/actions/multimodalActions';
import { createExam } from '../app/actions/examActions';

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

  it('returns classroom and card counters with a newly created exam', async () => {
    prismaMock.exam.create.mockResolvedValue({
      id: 'exam-new',
      classroomId: 'classroom-1',
      title: 'Yeni Sınav',
      subject: 'Fen Bilimleri',
      status: 'DRAFT',
      shortCode: 'ABC234',
      classroom: { id: 'classroom-1', name: '7-B', grade: '7', branch: 'B' },
      _count: { questions: 1, attempts: 0 },
      questions: [],
    });

    const created = await createExam({
      classroomId: 'classroom-1',
      title: 'Yeni Sınav',
      subject: 'Fen Bilimleri',
      questions: [
        {
          title: '1. Soru',
          questionText: 'Isı alan bir maddenin tanecikleri nasıl değişir?',
          maximumScore: 100,
          allowedResponseModes: ['DIRECT_TEXT'],
          targetedSkills: ['causalReasoning'],
          expectedConcepts: [],
          misconceptions: [],
        },
      ],
    });

    expect(prismaMock.exam.create).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          classroom: true,
          _count: { select: { questions: true, attempts: true } },
        }),
      })
    );
    expect(created).toMatchObject({
      classroom: { name: '7-B' },
      _count: { questions: 1, attempts: 0 },
    });
  });
});
