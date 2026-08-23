import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import prisma from '../lib/prisma';
import { hashAttemptToken } from '../lib/attemptTokens';
import {
  claimNextProcessingJob,
  completeProcessingJob,
  enqueueDurableResponseProcessing,
  failProcessingJob,
} from '../lib/durableProcessingQueue';

const databaseAvailable = Boolean(process.env.DATABASE_URL);

describe.runIf(databaseAvailable)('pilot hardening PostgreSQL integration', () => {
  const suffix = randomUUID();
  let teacherId: string | undefined;
  let classroomId: string | undefined;
  let examId: string | undefined;

  afterAll(async () => {
    if (examId) await prisma.exam.deleteMany({ where: { id: examId } });
    if (classroomId) await prisma.classroom.deleteMany({ where: { id: classroomId } });
    if (teacherId) await prisma.user.deleteMany({ where: { id: teacherId } });
  });

  it('stores only an attempt-token hash and durably claims/retries/completes a job', async () => {
    const teacher = await prisma.user.create({
      data: {
        email: `pilot-hardening-${suffix}@example.test`,
        name: 'Pilot Test Teacher',
      },
    });
    teacherId = teacher.id;
    const classroom = await prisma.classroom.create({
      data: {
        teacherId: teacher.id,
        name: `Pilot ${suffix}`,
        grade: '8',
        academicYear: '2026-2027',
      },
    });
    classroomId = classroom.id;
    const student = await prisma.studentRoster.create({
      data: {
        classroomId: classroom.id,
        schoolNumber: suffix,
        firstName: 'Pilot',
        lastName: 'Student',
      },
    });
    const exam = await prisma.exam.create({
      data: {
        teacherId: teacher.id,
        classroomId: classroom.id,
        title: 'Pilot Hardening Test',
        subject: 'Fen',
        status: 'PUBLISHED',
        shortCode: suffix.replace(/-/g, '').slice(0, 12),
      },
    });
    examId = exam.id;
    const question = await prisma.question.create({
      data: {
        examId: exam.id,
        questionOrder: 1,
        title: 'Soru',
        questionText: 'Neden?',
        allowedResponseModes: ['DIRECT_TEXT'],
        targetedSkills: ['causalReasoning'],
      },
    });
    const rawToken = generateTestToken(suffix);
    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentRosterId: student.id,
        attemptTokenHash: hashAttemptToken(rawToken),
        status: 'IN_PROGRESS',
      },
    });
    expect(attempt.attemptTokenHash).toBe(hashAttemptToken(rawToken));
    expect(JSON.stringify(attempt)).not.toContain(rawToken);

    const response = await prisma.studentResponse.create({
      data: { attemptId: attempt.id, questionId: question.id },
    });
    const first = await enqueueDurableResponseProcessing(response.id, { priority: 10_000 });
    const duplicate = await enqueueDurableResponseProcessing(response.id, { priority: 10_000 });
    expect(duplicate.id).toBe(first.id);

    const workerOne = `worker-one-${suffix}`;
    const claimed = await claimNextProcessingJob(workerOne, 60);
    expect(claimed?.id).toBe(first.id);
    expect(claimed?.attemptCount).toBe(1);

    await failProcessingJob(claimed!, workerOne, new Error('transient'));
    const retryScheduled = await prisma.responseProcessingJob.findUniqueOrThrow({
      where: { id: first.id },
    });
    expect(retryScheduled.status).toBe('RETRY_SCHEDULED');
    await prisma.responseProcessingJob.update({
      where: { id: first.id },
      data: { nextRetryAt: new Date(Date.now() - 1_000) },
    });

    const workerTwo = `worker-two-${suffix}`;
    const retried = await claimNextProcessingJob(workerTwo, 60);
    expect(retried?.id).toBe(first.id);
    expect(retried?.attemptCount).toBe(2);
    await completeProcessingJob(first.id, workerTwo);

    const completed = await prisma.responseProcessingJob.findUniqueOrThrow({
      where: { id: first.id },
    });
    expect(completed.status).toBe('COMPLETED');
    expect(completed.workerId).toBeNull();
    expect(completed.leaseExpiresAt).toBeNull();
  }, 30_000);
});

function generateTestToken(suffix: string): string {
  return `pilot-token-${suffix}`;
}
