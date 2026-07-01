import { NextResponse } from 'next/server';

import { getZipRow } from '@/lib/real-estate-market/seed';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ zip: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { zip } = await context.params;
  const row = getZipRow(zip);
  if (!row) {
    return NextResponse.json({ error: 'ZIP not found in seed data.' }, { status: 404 });
  }

  return NextResponse.json(row);
}
