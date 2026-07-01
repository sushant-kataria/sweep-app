import { getCompanyByTicker } from './companies-db';
import { isAnnualFactEntry } from './edgar-filing-forms';
import { fetchEdgarCompanyFacts } from './finance-edgar';
import { enrichMarketSnapshot } from './market-enrich';
import { getCachedStockScreener } from './stock-screener-cache';
import type { MarketSnapshot } from './market-types';

type EdgarFactEntry = {
  val: number;
  end: string;
  filed?: string;
  form?: string;
  fy?: number;
  fp?: string;
  frame?: string | null;
};

type EdgarFacts = Record<string, { units?: Record<string, EdgarFactEntry[]> }>;

const EPS_TAGS = ['EarningsPerShareDiluted', 'EarningsPerShareBasic'] as const;
const SHARES_TAGS = ['EntityCommonStockSharesOutstanding', 'CommonStockSharesOutstanding'] as const;

const metricsCache = new Map<string, { marketCap: number | null; peRatio: number | null; at: number }>();
const METRICS_CACHE_MS = 6 * 60 * 60 * 1000;

function pickLatestFact(facts: EdgarFacts, tags: readonly string[], unit: string): number | null {
  for (const tag of tags) {
    const units = facts[tag]?.units?.[unit];
    if (!units?.length) continue;
    const best = [...units]
      .filter((u) => isAnnualFactEntry(u))
      .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())[0];
    if (best) return best.val;
  }
  return null;
}

function parseMetricNumber(raw: string): number | null {
  const cleaned = raw.replace(/[$,%\s]/g, '').toUpperCase();
  if (!cleaned || cleaned === '—' || cleaned === '-') return null;
  const match = cleaned.match(/^(-?\d+(?:\.\d+)?)([TBMK])?$/);
  if (!match) return null;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;
  switch (match[2]) {
    case 'T':
      return base * 1e12;
    case 'B':
      return base * 1e9;
    case 'M':
      return base * 1e6;
    case 'K':
      return base * 1e3;
    default:
      return base;
  }
}

async function loadEdgarInputs(ticker: string): Promise<{ sharesOutstanding: number | null; epsDiluted: number | null }> {
  const company = await getCompanyByTicker(ticker);
  if (!company) return { sharesOutstanding: null, epsDiluted: null };

  try {
    const { facts } = await fetchEdgarCompanyFacts(company.cik);
    return {
      sharesOutstanding: pickLatestFact(facts, SHARES_TAGS, 'shares'),
      epsDiluted: pickLatestFact(facts, EPS_TAGS, 'USD/shares'),
    };
  } catch {
    return { sharesOutstanding: null, epsDiluted: null };
  }
}

/** Fill market cap and trailing P/E from Turso screener cache; optionally fetch SEC EDGAR. */
export async function enrichSnapshotForScreen(
  ticker: string,
  snapshot: MarketSnapshot,
  options: { fetchEdgar?: boolean } = {},
): Promise<MarketSnapshot> {
  const key = ticker.toUpperCase();
  const cached = metricsCache.get(key);
  if (cached && Date.now() - cached.at < METRICS_CACHE_MS) {
    return {
      ...snapshot,
      marketCap: cached.marketCap ?? snapshot.marketCap,
      peRatio: cached.peRatio ?? snapshot.peRatio,
    };
  }

  const company = await getCompanyByTicker(key);
  if (company) {
    const screener = await getCachedStockScreener(company.cik);
    if (screener) {
      let marketCap: number | null = null;
      let peRatio: number | null = null;
      for (const metric of screener.keyMetrics) {
        if (metric.label === 'Market cap') marketCap = parseMetricNumber(metric.value);
        if (metric.label === 'Stock P/E') peRatio = parseMetricNumber(metric.value);
      }
      if (marketCap != null || peRatio != null) {
        metricsCache.set(key, { marketCap, peRatio, at: Date.now() });
        return { ...snapshot, marketCap, peRatio };
      }
    }
  }

  if (!options.fetchEdgar) {
    return snapshot;
  }

  const edgar = await loadEdgarInputs(key);
  const enriched = enrichMarketSnapshot(snapshot, {
    sharesOutstanding: edgar.sharesOutstanding,
    epsDiluted: edgar.epsDiluted,
  });

  metricsCache.set(key, {
    marketCap: enriched.marketCap,
    peRatio: enriched.peRatio,
    at: Date.now(),
  });

  return enriched;
}
