import { NextResponse } from 'next/server';
import { getCatalogForClientSync } from '@/lib/tts/catalog';

export const runtime = 'nodejs';

export async function GET() {
  // Served directly from in-memory catalog (`lib/tts/catalog` <- `config/control.ts`) with 0ms DB delay
  const languages = getCatalogForClientSync();
  return NextResponse.json(
    { languages },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      },
    }
  );
}
