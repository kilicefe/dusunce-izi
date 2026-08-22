import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { assertMediaStorageReady, hasMediaStorageConfig } from '@/lib/mediaStorage';

export async function GET() {
  try {
    const requiredConfiguration = {
      database: Boolean(process.env.DATABASE_URL),
      mediaStorage: hasMediaStorageConfig(),
      processingWorker: Boolean(
        (process.env.PROCESSING_WORKER_SECRET || process.env.CRON_SECRET)?.length! >= 32
      ),
      aiProvider: Boolean(process.env.GEMINI_API_KEY),
    };
    const missing = Object.entries(requiredConfiguration)
      .filter(([, configured]) => !configured)
      .map(([name]) => name);
    if (missing.length) {
      return NextResponse.json(
        { status: 'not_ready', missing },
        { status: 503 }
      );
    }

    await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      assertMediaStorageReady(),
    ]);
    return NextResponse.json({
      status: 'ready',
      ...requiredConfiguration,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ status: 'not_ready', error: String(error) }, { status: 503 });
  }
}
