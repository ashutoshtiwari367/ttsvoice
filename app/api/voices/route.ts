import { NextResponse } from 'next/server';
import { getCatalogForClient } from '@/lib/tts/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const languages = await getCatalogForClient();
  return NextResponse.json(
    { languages },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
