import { NextResponse } from 'next/server';

import { searchCompanies } from '@/lib/companies-db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const rawLimit = Number(searchParams.get('limit') ?? 15);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, Math.floor(rawLimit)), 30) : 15;

  if (q.trim().length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchCompanies(q, limit);
    return NextResponse.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Search failed.';
    console.error('[companies/search]', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
