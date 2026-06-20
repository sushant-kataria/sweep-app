import type { MarketHistoryPoint, MarketRange, MarketSnapshot } from './market-types';

const YAHOO_USER_AGENT = 'Mozilla/5.0 (compatible; SweepFinance/1.0; +https://sweep-app.vercel.app)';

type YahooChartResult = {
  meta?: {
    currency?: string;
    symbol?: string;
    regularMarketPrice?: number;
    chartPreviousClose?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    regularMarketTime?: number;
  };
  timestamp?: number[];
  indicators?: { quote?: Array<{ close?: Array<number | null> }> };
};

export function normalizeYahooTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/\./g, '-');
}

function formatChartLabel(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function buildHistory(result: YahooChartResult): MarketHistoryPoint[] {
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const points: MarketHistoryPoint[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close == null || !Number.isFinite(close)) continue;
    points.push({ label: formatChartLabel(timestamps[i]), value: Math.round(close * 100) / 100 });
  }

  return points;
}

function thinHistory(points: MarketHistoryPoint[], maxPoints = 120): MarketHistoryPoint[] {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  return points.filter((_, i) => i % step === 0 || i === points.length - 1);
}

export async function fetchYahooMarketSnapshot(
  ticker: string,
  range: MarketRange = '1y',
): Promise<MarketSnapshot> {
  const symbol = normalizeYahooTicker(ticker);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;

  const res = await fetch(url, {
    headers: { 'User-Agent': YAHOO_USER_AGENT, Accept: 'application/json' },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Market data unavailable for ${ticker} (${res.status}).`);
  }

  const json = (await res.json()) as { chart?: { result?: YahooChartResult[]; error?: { description?: string } } };
  const result = json.chart?.result?.[0];
  if (!result?.meta?.regularMarketPrice) {
    throw new Error(json.chart?.error?.description ?? `No market data found for ${ticker}.`);
  }

  const meta = result.meta;
  const price = meta.regularMarketPrice!;
  const previousClose = meta.chartPreviousClose ?? price;
  const change = price - previousClose;
  const changePct = previousClose ? (change / previousClose) * 100 : 0;
  const history = thinHistory(buildHistory(result));

  return {
    ticker: ticker.toUpperCase(),
    currency: meta.currency ?? 'USD',
    price,
    previousClose,
    change,
    changePct,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
    marketCap: null,
    peRatio: null,
    asOf: meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : new Date().toISOString(),
    source: 'yahoo',
    range,
    history,
  };
}

export async function fetchFinnhubQuote(ticker: string): Promise<{
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
} | null> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return null;

  const symbol = normalizeYahooTicker(ticker);
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return null;

  const json = (await res.json()) as { c?: number; pc?: number; dp?: number };
  if (!json.c || !json.pc) return null;

  return {
    price: json.c,
    previousClose: json.pc,
    change: json.c - json.pc,
    changePct: json.dp ?? ((json.c - json.pc) / json.pc) * 100,
  };
}
