import { NextResponse } from 'next/server';

import { runRealEstateScreen } from '@/lib/real-estate-market/engine';
import { requireSweepUserApi } from '@/lib/sweep-auth';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  const user = await requireSweepUserApi();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required for investor screens.' }, { status: 401 });
  }

  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '25');

  try {
    const result = await runRealEstateScreen(id, { page, limit });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Screen scan failed.';
    return NextResponse.json(
      { error: message },
      { status: e instanceof Error && message === 'Screen not found.' ? 404 : 500 },
    );
  }
}
