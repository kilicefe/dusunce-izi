import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { processDurableResponseJob } from '@/lib/databaseProcessingWorker';
import {
  drainProcessingQueue,
  isProcessingWorkerAuthorized,
} from '@/lib/durableProcessingQueue';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const workerSecret =
    process.env.PROCESSING_WORKER_SECRET || process.env.CRON_SECRET;
  if (!workerSecret) {
    return NextResponse.json(
      { error: 'PROCESSING_WORKER_NOT_CONFIGURED' },
      { status: 503 }
    );
  }
  if (!isProcessingWorkerAuthorized(request.headers.get('authorization'), workerSecret)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const requestedBatch = Number(request.nextUrl.searchParams.get('limit') || '1');
  const batchSize = Number.isSafeInteger(requestedBatch) ? requestedBatch : 1;
  const result = await drainProcessingQueue({
    workerId: `http-worker-${randomUUID()}`,
    batchSize,
    handler: processDurableResponseJob,
  });

  return NextResponse.json(result);
}

export const GET = POST;
