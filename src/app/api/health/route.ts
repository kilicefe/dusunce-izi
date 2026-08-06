import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'dusunce-izi',
    timestamp: new Date().toISOString()
  });
}
