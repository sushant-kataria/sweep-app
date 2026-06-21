import { getMarketSnapshot } from './market-cache';
import { getScreenById, LIVE_SCREEN_UNIVERSE, type FinanceScreen } from './finance-screens';
import {
  computeRsi,
  computeSma,
  pctFromHigh,
  pctFromLow,
} from './stock-screen-technical';
import type { MarketSnapshot } from './market-types';

export type ScreenMatch = {
  ticker: string;
  score?: number;
  hint?: string;
};

const BATCH = 8;

async function mapPool<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(fn));
    out.push(...results);
  }
  return out;
}

function closes(snapshot: MarketSnapshot): number[] {
  return snapshot.history.map((p) => p.value).filter((v) => Number.isFinite(v));
}

function evalLiveScreen(screenId: string, snapshot: MarketSnapshot): ScreenMatch | null {
  const ticker = snapshot.ticker.toUpperCase();
  const price = snapshot.price;
  const high = snapshot.fiftyTwoWeekHigh;
  const low = snapshot.fiftyTwoWeekLow;
  const series = closes(snapshot);
  if (series.length < 30 || price <= 0) return null;

  const sma50 = computeSma(series, 50);
  const sma200 = computeSma(series, 200);
  const prevSma50 = computeSma(series.slice(0, -1), 50);
  const prevSma200 = computeSma(series.slice(0, -1), 200);
  const rsi = computeRsi(series);
  const vol = snapshot.volume ?? 0;

  switch (screenId) {
    case 'companies-creating-new-high':
    case 'breakout-stocks': {
      const pct = pctFromHigh(price, high);
      if (pct == null || pct > 10) return null;
      return { ticker, score: 100 - pct, hint: `${pct.toFixed(1)}% below 52W high` };
    }
    case 'low-from-52w-high':
    case 'good-stocks-near-52w-low': {
      const pct = pctFromHigh(price, high);
      if (pct == null || pct < 25) return null;
      return { ticker, score: pct, hint: `${pct.toFixed(0)}% below 52W high` };
    }
    case 'darvas-scan': {
      const pct = pctFromHigh(price, high);
      const aboveLow = pctFromLow(price, low);
      if (pct == null || pct > 10 || price < 10 || vol < 100_000) return null;
      if (aboveLow == null || aboveLow < 50) return null;
      return { ticker, score: 100 - pct, hint: 'Darvas box criteria' };
    }
    case 'golden-crossover': {
      if (sma50 == null || sma200 == null || prevSma50 == null || prevSma200 == null) return null;
      if (sma50 > sma200 && prevSma50 <= prevSma200) {
        return { ticker, score: sma50 - sma200, hint: '50 DMA crossed above 200 DMA' };
      }
      return null;
    }
    case 'bearish-crossovers': {
      if (sma50 == null || sma200 == null || prevSma50 == null || prevSma200 == null) return null;
      if (sma50 < sma200 && prevSma50 >= prevSma200) {
        return { ticker, score: sma200 - sma50, hint: '50 DMA crossed below 200 DMA' };
      }
      return null;
    }
    case 'rsi-oversold': {
      if (rsi == null || rsi >= 30) return null;
      return { ticker, score: 30 - rsi, hint: `RSI ${rsi.toFixed(1)}` };
    }
    case 'stocks-near-200-dma': {
      if (sma200 == null) return null;
      const diffPct = (Math.abs(price - sma200) / sma200) * 100;
      if (diffPct > 5) return null;
      return { ticker, score: 5 - diffPct, hint: `Within ${diffPct.toFixed(1)}% of 200 DMA` };
    }
    case 'price-volume-action': {
      if (series.length < 25) return null;
      const recent = series.slice(-5);
      const prior = series.slice(-25, -5);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
      if (priorAvg <= 0 || recentAvg <= priorAvg * 1.02) return null;
      if (vol < 100_000) return null;
      const move = ((recentAvg - priorAvg) / priorAvg) * 100;
      return { ticker, score: move, hint: `Price momentum +${move.toFixed(1)}%` };
    }
    default:
      return null;
  }
}

export async function runLiveScreen(screenId: string): Promise<{
  screen: FinanceScreen;
  matches: ScreenMatch[];
  live: boolean;
}> {
  const screen = getScreenById(screenId);
  if (!screen) throw new Error('Screen not found.');
  if (screen.mode !== 'live') {
    return {
      screen,
      matches: screen.tickers.map((ticker) => ({ ticker })),
      live: false,
    };
  }

  const universe = LIVE_SCREEN_UNIVERSE;
  const evaluated = await mapPool(universe, async (ticker) => {
    try {
      const snapshot = await getMarketSnapshot(ticker, '1y');
      return evalLiveScreen(screenId, snapshot);
    } catch {
      return null;
    }
  });

  const matches = evaluated
    .filter((m): m is ScreenMatch => m != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 25);

  if (matches.length === 0) {
    return {
      screen,
      matches: screen.tickers.map((ticker) => ({ ticker })),
      live: false,
    };
  }

  return { screen, matches, live: true };
}
