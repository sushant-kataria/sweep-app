import { NextResponse } from 'next/server';

import { getMarketSnapshot } from '@/lib/market-cache';
import type { MarketRange } from '@/lib/market-types';

export const runtime = 'nodejs';

const RANGES = new Set<MarketRange>(['6mo', '1y', '5y']);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker') ?? '';
  const rangeParam = (searchParams.get('range') ?? '1y') as MarketRange;
  const range = RANGES.has(rangeParam) ? rangeParam : '1y';

  if (!ticker.trim()) {
    return NextResponse.json({ error: 'Ticker required.' }, { status: 400 });
  }

  try {
    const snapshot = await getMarketSnapshot(ticker, range);
    return NextResponse.json(snapshot);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Market data unavailable.';
    console.error('[market/snapshot]', ticker, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
