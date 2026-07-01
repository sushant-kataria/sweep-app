import { NextResponse } from 'next/server';

import { runScreenResults } from '@/lib/stock-screen-engine';
import { applyFreeSampleLimit } from '@/lib/free-tier-limits';
import { requireProUserApi } from '@/lib/sweep-auth';

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
    const result = await runScreenResults(id, { page, limit, query });
    const proUser = await requireProUserApi();
    if (!proUser) {
      return NextResponse.json(applyFreeSampleLimit(result));
    }
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Screen scan failed.';
    return NextResponse.json(
      { error: message },
      { status: e instanceof Error && message === 'Screen not found.' ? 404 : 500 },
    );
  }
}
