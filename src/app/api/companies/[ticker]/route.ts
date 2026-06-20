import { NextResponse } from 'next/server';

import { getCompanyByTicker } from '@/lib/companies-db';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ ticker: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { ticker } = await context.params;

  try {
    const company = await getCompanyByTicker(ticker);
    if (!company) {
      return NextResponse.json({ error: 'Company not found in SEC index.' }, { status: 404 });
    }
    return NextResponse.json({ company });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Lookup failed.';
    console.error('[companies/ticker]', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
