import { getMarketSnapshot } from './market-cache';
import { getCompanyNamesForTickers } from './screen-companies';
import { enrichSnapshotForScreen } from './screen-market-enrich';
import { filterRowsByQuery, getDefaultScreenQuery } from './screen-query';
import type { ScreenColumnDef, ScreenResultRow, ScreenResultsPayload } from './screen-result-types';
import { DEFAULT_SCREEN_COLUMNS } from './screen-result-types';
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
    case 'low-from-52w-high': {
      const pct = pctFromHigh(price, high);
      if (pct == null || pct < 25) return null;
      return { ticker, score: pct, hint: `${pct.toFixed(0)}% below 52W high` };
    }
    case 'good-stocks-near-52w-low': {
      const nearLow = pctFromLow(price, low);
      if (nearLow == null || nearLow > 15 || vol < 300_000) return null;
      return { ticker, score: nearLow, hint: `${nearLow.toFixed(0)}% above 52W low` };
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

function curatedSignal(screen: FinanceScreen, live: boolean): string {
  if (screen.mode === 'live' && !live) {
    return 'Starter list · live scan had no matches';
  }
  if (screen.mode === 'curated') {
    return 'Starter list · verify formula on stock page';
  }
  return 'Starter list';
}

function rowSignal(match: ScreenMatch | undefined, screen: FinanceScreen, live: boolean): string | null {
  if (match?.hint) return match.hint;
  if (screen.mode === 'live' && live) return null;
  return curatedSignal(screen, live);
}

async function enrichRow(
  ticker: string,
  match: ScreenMatch | undefined,
  screen: FinanceScreen,
  names: Map<string, string>,
  live: boolean,
  fetchEdgar: boolean,
): Promise<ScreenResultRow> {
  const key = ticker.toUpperCase();
  let snapshot: MarketSnapshot | null = null;
  let rsi: number | null = null;

  try {
    const base = await getMarketSnapshot(key, '1y');
    snapshot = await enrichSnapshotForScreen(key, base, { fetchEdgar });
    const series = closes(snapshot);
    rsi = computeRsi(series);
  } catch {
    snapshot = null;
  }

  return {
    ticker: key,
    companyName: names.get(key) ?? key,
    price: snapshot?.price ?? null,
    pe: snapshot?.peRatio ?? null,
    marketCap: snapshot?.marketCap ?? null,
    volume: snapshot?.volume ?? null,
    changePct: snapshot?.changePct ?? null,
    score: match?.score ?? null,
    signal: rowSignal(match, screen, live),
    rsi,
  };
}

function columnsForScreen(screen: FinanceScreen, live: boolean): ScreenColumnDef[] {
  const cols = [...DEFAULT_SCREEN_COLUMNS];

  if (screen.id === 'rsi-oversold') {
    cols.push({ id: 'rsi', label: 'RSI' });
  } else if (screen.mode === 'live' && live) {
    cols.push({ id: 'signal', label: 'Signal' });
  } else {
    cols.push({ id: 'signal', label: 'Note' });
  }

  return cols;
}

export async function runLiveScreen(screenId: string): Promise<{
  screen: FinanceScreen;
  matches: ScreenMatch[];
  live: boolean;
}> {
  const result = await runScreenMatches(screenId);
  return result;
}

async function runScreenMatches(screenId: string): Promise<{
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

  const evaluated = await mapPool(LIVE_SCREEN_UNIVERSE, async (ticker) => {
    try {
      const snapshot = await getMarketSnapshot(ticker, '1y');
      return evalLiveScreen(screenId, snapshot);
    } catch {
      return null;
    }
  });

  const matches = evaluated
    .filter((m): m is ScreenMatch => m != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  if (matches.length === 0) {
    return {
      screen,
      matches: screen.tickers.map((ticker) => ({ ticker })),
      live: false,
    };
  }

  return { screen, matches, live: true };
}

export type RunScreenResultsOptions = {
  page?: number;
  limit?: number;
  query?: string;
};

export async function runScreenResults(
  screenId: string,
  options: RunScreenResultsOptions = {},
): Promise<ScreenResultsPayload> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(10, options.limit ?? 25));

  const { screen, matches, live } = await runScreenMatches(screenId);
  const defaultQuery = getDefaultScreenQuery(screen);
  const query = options.query?.trim() || defaultQuery;
  const fallback = screen.mode === 'live' && !live;

  const tickers = matches.map((m) => m.ticker);
  const matchByTicker = new Map(matches.map((m) => [m.ticker.toUpperCase(), m]));
  const names = await getCompanyNamesForTickers(tickers);
  const fetchEdgar = tickers.length <= 15;

  const rows: ScreenResultRow[] = [];
  for (let i = 0; i < tickers.length; i += BATCH) {
    const batch = tickers.slice(i, i + BATCH);
    const batchRows = await Promise.all(
      batch.map((ticker) =>
        enrichRow(ticker, matchByTicker.get(ticker.toUpperCase()), screen, names, live, fetchEdgar),
      ),
    );
    rows.push(...batchRows);
  }

  const filtered = filterRowsByQuery(rows, query);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const pageRows = filtered.slice(start, start + limit);

  const scanNote = fallback
    ? 'Live scan found no matches at the moment. Showing the starter watchlist — each row still has live price data.'
    : screen.mode === 'curated'
      ? 'Starter watchlist for this formula. Use the query box to filter on price, P/E, market cap, volume, or RSI. Full XBRL metrics are on the stock page.'
      : 'Live scan results from standard market formulas on the US large-cap universe.';

  return {
    id: screen.id,
    title: screen.title,
    description: screen.description,
    formula: screen.formula,
    defaultQuery,
    live,
    fallback,
    scanNote,
    total,
    page: safePage,
    limit,
    totalPages,
    query,
    columns: columnsForScreen(screen, live),
    rows: pageRows,
  };
}

export async function runSectorResults(
  sectorId: string,
  options: RunScreenResultsOptions = {},
): Promise<ScreenResultsPayload | null> {
  const { FINANCE_SECTORS } = await import('./finance-screens');
  const sector = FINANCE_SECTORS.find((s) => s.id === sectorId);
  if (!sector) return null;

  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(10, options.limit ?? 25));
  const defaultQuery = 'Price > 0';
  const query = options.query?.trim() || defaultQuery;

  const sectorScreen: FinanceScreen = {
    id: sector.id,
    title: sector.label,
    description: sector.description,
    category: 'popular',
    mode: 'curated',
    tickers: sector.tickers,
  };

  const names = await getCompanyNamesForTickers(sector.tickers);
  const rows: ScreenResultRow[] = [];
  for (let i = 0; i < sector.tickers.length; i += BATCH) {
    const batch = sector.tickers.slice(i, i + BATCH);
    const batchRows = await Promise.all(
      batch.map((ticker) => enrichRow(ticker, undefined, sectorScreen, names, false, true)),
    );
    rows.push(...batchRows);
  }

  const filtered = filterRowsByQuery(rows, query);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  return {
    id: sector.id,
    title: sector.label,
    description: sector.description,
    defaultQuery,
    live: false,
    scanNote: 'Sector constituents with live market data. Filter by price, P/E, market cap, volume, or RSI.',
    total,
    page: safePage,
    limit,
    totalPages,
    query,
    columns: columnsForScreen(sectorScreen, false),
    rows: filtered.slice(start, start + limit),
  };
}
