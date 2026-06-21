import { NextResponse } from 'next/server';

import { runSectorResults } from '@/lib/stock-screen-engine';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '25');
  const query = searchParams.get('query') ?? undefined;

  try {
    const result = await runSectorResults(id, { page, limit, query });
    if (!result) {
      return NextResponse.json({ error: 'Sector not found.' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sector scan failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
