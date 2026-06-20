import { NextResponse } from 'next/server';

import { getCompanyByTicker } from '@/lib/companies-db';
import { getMarketSnapshot } from '@/lib/market-cache';
import { buildLiveStockSession } from '@/lib/stock-live-session';
import { buildStockSession } from '@/lib/stock-session';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ ticker: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const normalized = ticker.trim().toUpperCase();

  if (!normalized) {
    return NextResponse.json({ error: 'Ticker required.' }, { status: 400 });
  }

  const preloaded = buildStockSession(normalized);
  if (preloaded) {
    return NextResponse.json(preloaded);
  }

  try {
    const company = await getCompanyByTicker(normalized);
    if (!company) {
      return NextResponse.json(
        { error: `No SEC company found for ${normalized}. Search by ticker or company name.` },
        { status: 404 },
      );
    }

    const snapshot = await getMarketSnapshot(normalized, '1y');
    const session = buildLiveStockSession(company, snapshot);
    return NextResponse.json(session);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load equity profile.';
    console.error('[stock/session]', normalized, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
