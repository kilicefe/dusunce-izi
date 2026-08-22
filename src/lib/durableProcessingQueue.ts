import { createHash, timingSafeEqual } from 'node:crypto';
import { JobType, Prisma, ResponseProcessingJob } from '@prisma/client';
import prisma from './prisma';

const DEFAULT_LEASE_SECONDS = 300;
const MAX_BATCH_SIZE = 10;

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function computeRetryDelayMs(attemptCount: number): number {
  const normalizedAttempt = Math.max(1, Math.floor(attemptCount));
  return Math.min(30_000 * 2 ** (normalizedAttempt - 1), 15 * 60_000);
}

export function isProcessingWorkerAuthorized(
  authorizationHeader: string | null,
  configuredSecret: string | undefined
): boolean {
  if (
    !authorizationHeader?.startsWith('Bearer ') ||
    !configuredSecret ||
    configuredSecret.length < 32 ||
    authorizationHeader.length > 1_024
  ) return false;
  const provided = authorizationHeader.slice('Bearer '.length);
  const providedHash = createHash('sha256').update(provided).digest();
  const expectedHash = createHash('sha256').update(configuredSecret).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

export async function enqueueDurableResponseProcessing(
  studentResponseId: string,
  options: {
    idempotencyKey?: string;
    jobType?: JobType;
    priority?: number;
  } = {}
): Promise<ResponseProcessingJob> {
  const idempotencyKey =
    options.idempotencyKey || `prepare-${studentResponseId}-v1`;

  return prisma.responseProcessingJob.upsert({
    where: { idempotencyKey },
    update: {},
    create: {
      studentResponseId,
      jobType: options.jobType || JobType.PREPARE_RESPONSE,
      idempotencyKey,
      priority: options.priority ?? 1,
      processingVersion: '1.0.0',
    },
  });
}

export async function claimNextProcessingJob(
  workerId: string,
  leaseSeconds = positiveInteger(
    process.env.PROCESSING_JOB_LEASE_SECONDS,
    DEFAULT_LEASE_SECONDS
  )
): Promise<ResponseProcessingJob | null> {
  const now = new Date();
  const leaseExpiresAt = new Date(now.getTime() + leaseSeconds * 1000);

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      UPDATE "ResponseProcessingJob"
      SET
        "status" = 'FAILED',
        "failedAt" = CURRENT_TIMESTAMP,
        "lastErrorCode" = 'LEASE_EXHAUSTED',
        "lastErrorMessage" = 'Worker lease expired after maximum attempts.',
        "workerId" = NULL,
        "leaseExpiresAt" = NULL,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "status"::text = 'RUNNING'
        AND "leaseExpiresAt" <= CURRENT_TIMESTAMP
        AND "attemptCount" >= "maximumAttempts"
    `);

    const candidates = await tx.$queryRaw<ResponseProcessingJob[]>(Prisma.sql`
      SELECT *
      FROM "ResponseProcessingJob"
      WHERE "attemptCount" < "maximumAttempts"
        AND (
          (
            "status"::text IN ('QUEUED', 'RETRY_SCHEDULED')
            AND COALESCE("nextRetryAt", "scheduledAt") <= CURRENT_TIMESTAMP
          )
          OR (
            "status"::text = 'RUNNING'
            AND "leaseExpiresAt" <= CURRENT_TIMESTAMP
          )
        )
      ORDER BY "priority" DESC, "scheduledAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `);

    const candidate = candidates[0];
    if (!candidate) return null;

    return tx.responseProcessingJob.update({
      where: { id: candidate.id },
      data: {
        status: 'RUNNING',
        workerId,
        leaseExpiresAt,
        startedAt: now,
        failedAt: null,
        nextRetryAt: null,
        attemptCount: { increment: 1 },
      },
    });
  });
}

export async function extendProcessingJobLease(
  jobId: string,
  workerId: string,
  leaseSeconds = positiveInteger(
    process.env.PROCESSING_JOB_LEASE_SECONDS,
    DEFAULT_LEASE_SECONDS
  )
): Promise<boolean> {
  const result = await prisma.responseProcessingJob.updateMany({
    where: { id: jobId, workerId, status: 'RUNNING' },
    data: { leaseExpiresAt: new Date(Date.now() + leaseSeconds * 1000) },
  });
  return result.count === 1;
}

export async function completeProcessingJob(jobId: string, workerId: string): Promise<void> {
  const result = await prisma.responseProcessingJob.updateMany({
    where: { id: jobId, workerId, status: 'RUNNING' },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      leaseExpiresAt: null,
      workerId: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  });
  if (result.count !== 1) throw new Error('PROCESSING_JOB_LEASE_LOST');
}

export async function failProcessingJob(
  job: ResponseProcessingJob,
  workerId: string,
  error: unknown
): Promise<void> {
  const exhausted = job.attemptCount >= job.maximumAttempts;
  const message = error instanceof Error ? error.message : String(error);
  const result = await prisma.responseProcessingJob.updateMany({
    where: { id: job.id, workerId, status: 'RUNNING' },
    data: {
      status: exhausted ? 'FAILED' : 'RETRY_SCHEDULED',
      failedAt: exhausted ? new Date() : null,
      nextRetryAt: exhausted
        ? null
        : new Date(Date.now() + computeRetryDelayMs(job.attemptCount)),
      leaseExpiresAt: null,
      workerId: null,
      lastErrorCode: 'PROCESSING_ERROR',
      lastErrorMessage: message.slice(0, 2_000),
    },
  });
  if (result.count !== 1) throw new Error('PROCESSING_JOB_LEASE_LOST');

  if (exhausted) {
    await prisma.examAttempt.updateMany({
      where: { responses: { some: { id: job.studentResponseId } } },
      data: { status: 'FAILED' },
    });
  }
}

export async function drainProcessingQueue(input: {
  workerId: string;
  batchSize?: number;
  handler: (job: ResponseProcessingJob) => Promise<void>;
}): Promise<{ claimed: number; completed: number; failed: number }> {
  const batchSize = Math.min(Math.max(input.batchSize || 1, 1), MAX_BATCH_SIZE);
  let claimed = 0;
  let completed = 0;
  let failed = 0;
  const leaseSeconds = positiveInteger(
    process.env.PROCESSING_JOB_LEASE_SECONDS,
    DEFAULT_LEASE_SECONDS
  );

  for (let index = 0; index < batchSize; index += 1) {
    const job = await claimNextProcessingJob(input.workerId);
    if (!job) break;
    claimed += 1;

    const heartbeat = setInterval(() => {
      void extendProcessingJobLease(job.id, input.workerId, leaseSeconds).catch((error) => {
        console.error(`Processing lease heartbeat failed for ${job.id}:`, error);
      });
    }, Math.max(1_000, Math.floor((leaseSeconds * 1_000) / 3)));

    try {
      await input.handler(job);
      await completeProcessingJob(job.id, input.workerId);
      completed += 1;
    } catch (error) {
      await failProcessingJob(job, input.workerId, error);
      failed += 1;
    } finally {
      clearInterval(heartbeat);
    }
  }

  return { claimed, completed, failed };
}
