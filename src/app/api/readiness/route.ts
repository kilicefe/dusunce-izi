import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ready',
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ status: 'not_ready', error: String(error) }, { status: 503 });
  }
}
