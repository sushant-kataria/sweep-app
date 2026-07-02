import { NextResponse } from 'next/server';

import { getCompanyByTicker } from '@/lib/companies-db';
import { buildEdgarFinanceSession, buildPreloadedFinanceSession } from '@/lib/finance-session';
import { requireProUserApi } from '@/lib/sweep-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ ticker: string }> };

export async function GET(req: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') ?? undefined;

  try {
    const normalized = ticker.trim().toUpperCase();
    if (!normalized) {
      return NextResponse.json({ error: 'Ticker required.' }, { status: 400 });
    }

    const preloaded = buildPreloadedFinanceSession(normalized, period);
    if (preloaded) {
      return NextResponse.json(preloaded);
    }

    if (!preloaded) {
      const proUser = await requireProUserApi();
      if (!proUser) {
        return NextResponse.json(
          {
            error: 'Pro required for live SEC balance sheets. Free tier includes Top 25 preloaded demos.',
            code: 'PRO_REQUIRED',
          },
          { status: 402 },
        );
      }
    }

    const company = await getCompanyByTicker(normalized);
    if (!company) {
      return NextResponse.json({ error: 'Company not found in SEC index.' }, { status: 404 });
    }

    const session = await buildEdgarFinanceSession({
      cik: company.cik,
      ticker: company.ticker,
      companyName: company.name,
    });

    return NextResponse.json(session);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not load SEC report.';
    console.error('[companies/report]', ticker, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
