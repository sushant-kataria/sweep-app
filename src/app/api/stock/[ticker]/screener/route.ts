import { NextResponse } from 'next/server';

import { getCompanyByTicker } from '@/lib/companies-db';
import { buildStockScreenerData } from '@/lib/edgar-stock-screener';
import { buildEdgarFinanceSession } from '@/lib/finance-session';
import { getMarketSnapshot } from '@/lib/market-cache';
import { getStockOption } from '@/lib/stock-data';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ ticker: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const normalized = ticker.trim().toUpperCase();

  if (!normalized) {
    return NextResponse.json({ error: 'Ticker required.' }, { status: 400 });
  }

  try {
    const company = await getCompanyByTicker(normalized);
    if (!company) {
      return NextResponse.json({ error: 'Company not found in SEC index.' }, { status: 404 });
    }

    const [market, financeSession] = await Promise.all([
      getMarketSnapshot(normalized, '1y').catch(() => null),
      buildEdgarFinanceSession({
        cik: company.cik,
        ticker: company.ticker,
        companyName: company.name,
      }).catch(() => null),
    ]);

    const option = getStockOption(normalized);
    const data = await buildStockScreenerData({
      company,
      market,
      metrics: financeSession?.metrics ?? null,
      sector: option?.sector,
    });

    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not load stock screener data.';
    console.error('[stock/screener]', normalized, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
