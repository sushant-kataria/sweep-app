import type { MarketRange, MarketSnapshot } from './market-types';
import { fetchFinnhubQuote, fetchYahooMarketSnapshot } from './market-yahoo';
import { getTurso, isTursoConfigured } from './turso';

const CACHE_TTL_MS: Record<MarketRange, number> = {
  '6mo': 60 * 60 * 1000,
  '1y': 60 * 60 * 1000,
  '5y': 6 * 60 * 60 * 1000,
};

export async function ensureMarketCacheTable(): Promise<void> {
  if (!isTursoConfigured()) return;
  const db = getTurso();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS market_snapshots (
      cache_key TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      range_key TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_market_snapshots_ticker ON market_snapshots(ticker)`);
}

function cacheKey(ticker: string, range: MarketRange) {
  return `${ticker.toUpperCase()}:${range}`;
}

export async function getCachedMarketSnapshot(
  ticker: string,
  range: MarketRange,
): Promise<MarketSnapshot | null> {
  if (!isTursoConfigured()) return null;
  try {
    await ensureMarketCacheTable();
    const db = getTurso();
    const result = await db.execute({
      sql: 'SELECT snapshot_json, fetched_at FROM market_snapshots WHERE cache_key = ? LIMIT 1',
      args: [cacheKey(ticker, range)],
    });
    const row = result.rows[0];
    if (!row) return null;

    const fetchedAt = new Date(String(row.fetched_at)).getTime();
    if (!Number.isFinite(fetchedAt) || Date.now() - fetchedAt > CACHE_TTL_MS[range]) {
      return null;
    }

    return JSON.parse(String(row.snapshot_json)) as MarketSnapshot;
  } catch {
    return null;
  }
}

export async function setCachedMarketSnapshot(snapshot: MarketSnapshot): Promise<void> {
  if (!isTursoConfigured()) return;
  try {
    await ensureMarketCacheTable();
    const db = getTurso();
    await db.execute({
      sql: `
        INSERT INTO market_snapshots (cache_key, ticker, range_key, snapshot_json, fetched_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(cache_key) DO UPDATE SET
          snapshot_json = excluded.snapshot_json,
          fetched_at = excluded.fetched_at
      `,
      args: [
        cacheKey(snapshot.ticker, snapshot.range),
        snapshot.ticker.toUpperCase(),
        snapshot.range,
        JSON.stringify(snapshot),
        new Date().toISOString(),
      ],
    });
  } catch (e) {
    console.warn('[market-cache] write failed', e);
  }
}

export async function getMarketSnapshot(ticker: string, range: MarketRange = '1y'): Promise<MarketSnapshot> {
  const normalized = ticker.trim().toUpperCase();
  if (!normalized) throw new Error('Ticker required.');

  const cached = await getCachedMarketSnapshot(normalized, range);
  if (cached) return cached;

  let snapshot = await fetchYahooMarketSnapshot(normalized, range);

  const finnhub = await fetchFinnhubQuote(normalized);
  if (finnhub) {
    snapshot = {
      ...snapshot,
      price: finnhub.price,
      previousClose: finnhub.previousClose,
      change: finnhub.change,
      changePct: finnhub.changePct,
      source: 'finnhub',
    };
  }

  await setCachedMarketSnapshot(snapshot);
  return snapshot;
}
