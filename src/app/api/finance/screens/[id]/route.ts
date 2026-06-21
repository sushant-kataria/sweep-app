import { NextResponse } from 'next/server';

import { runLiveScreen } from '@/lib/stock-screen-engine';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const result = await runLiveScreen(id);
    return NextResponse.json({
      id: result.screen.id,
      title: result.screen.title,
      live: result.live,
      formula: result.screen.formula,
      matches: result.matches,
      tickers: result.matches.map((m) => m.ticker),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Screen scan failed.';
    return NextResponse.json({ error: message }, { status: e instanceof Error && message === 'Screen not found.' ? 404 : 500 });
  }
}
