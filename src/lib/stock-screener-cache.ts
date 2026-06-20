import type { SecCompany } from './company-types';
import { buildStockScreenerData } from './edgar-stock-screener';
import { buildEdgarFinanceSession } from './finance-session';
import { getMarketSnapshot } from './market-cache';
import { getFundamentals, getStockOption } from './stock-data';
import type { StockScreenerData } from './stock-screener-types';
import { SCREENER_CACHE_TTL_MS, SCREENER_PARSER_VERSION } from './stock-screener-types';
import { getTurso, isTursoConfigured } from './turso';

export async function ensureStockScreenerCacheTable(): Promise<void> {
  if (!isTursoConfigured()) return;
  const db = getTurso();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS stock_screener_cache (
      cik TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      screener_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      parser_version INTEGER NOT NULL,
      latest_filing_date TEXT
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_stock_screener_ticker ON stock_screener_cache(ticker)`);
}

function isCacheValid(row: { fetched_at: string; parser_version: number }): boolean {
  const fetchedAt = new Date(String(row.fetched_at)).getTime();
  if (!Number.isFinite(fetchedAt) || Date.now() - fetchedAt > SCREENER_CACHE_TTL_MS) {
    return false;
  }
  return Number(row.parser_version) === SCREENER_PARSER_VERSION;
}

export async function getCachedStockScreener(cik: string): Promise<StockScreenerData | null> {
  if (!isTursoConfigured()) return null;
  try {
    await ensureStockScreenerCacheTable();
    const db = getTurso();
    const result = await db.execute({
      sql: 'SELECT screener_json, fetched_at, parser_version FROM stock_screener_cache WHERE cik = ? LIMIT 1',
      args: [cik],
    });
    const row = result.rows[0];
    if (!row || !isCacheValid(row as { fetched_at: string; parser_version: number })) {
      return null;
    }
    const data = JSON.parse(String(row.screener_json)) as StockScreenerData;
    return { ...data, fromCache: true };
  } catch {
    return null;
  }
}

export async function setCachedStockScreener(data: StockScreenerData): Promise<void> {
  if (!isTursoConfigured()) return;
  try {
    await ensureStockScreenerCacheTable();
    const db = getTurso();
    await db.execute({
      sql: `
        INSERT INTO stock_screener_cache (cik, ticker, screener_json, fetched_at, parser_version, latest_filing_date)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(cik) DO UPDATE SET
          ticker = excluded.ticker,
          screener_json = excluded.screener_json,
          fetched_at = excluded.fetched_at,
          parser_version = excluded.parser_version,
          latest_filing_date = excluded.latest_filing_date
      `,
      args: [
        data.cik,
        data.ticker.toUpperCase(),
        JSON.stringify({ ...data, fromCache: false }),
        new Date(data.loadedAt).toISOString(),
        SCREENER_PARSER_VERSION,
        data.latestFilingDate ?? null,
      ],
    });
  } catch (e) {
    console.warn('[stock-screener-cache] write failed', e);
  }
}

export async function invalidateStockScreenerCache(ciks: string[]): Promise<number> {
  if (!isTursoConfigured() || ciks.length === 0) return 0;
  await ensureStockScreenerCacheTable();
  const db = getTurso();
  let deleted = 0;
  for (const cik of ciks) {
    const result = await db.execute({
      sql: 'DELETE FROM stock_screener_cache WHERE cik = ?',
      args: [cik],
    });
    deleted += result.rowsAffected ?? 0;
  }
  return deleted;
}

export async function purgeExpiredStockScreenerCache(): Promise<number> {
  if (!isTursoConfigured()) return 0;
  await ensureStockScreenerCacheTable();
  const db = getTurso();
  const cutoff = new Date(Date.now() - SCREENER_CACHE_TTL_MS).toISOString();
  const result = await db.execute({
    sql: 'DELETE FROM stock_screener_cache WHERE fetched_at < ? OR parser_version != ?',
    args: [cutoff, SCREENER_PARSER_VERSION],
  });
  return result.rowsAffected ?? 0;
}

export async function getOrBuildStockScreener(input: {
  company: SecCompany;
}): Promise<StockScreenerData> {
  const cached = await getCachedStockScreener(input.company.cik);
  if (cached) return cached;

  const normalized = input.company.ticker.toUpperCase();
  const [market, financeSession] = await Promise.all([
    getMarketSnapshot(normalized, '1y').catch(() => null),
    buildEdgarFinanceSession({
      cik: input.company.cik,
      ticker: input.company.ticker,
      companyName: input.company.name,
    }).catch(() => null),
  ]);

  const option = getStockOption(normalized);
  const data = await buildStockScreenerData({
    company: input.company,
    market,
    metrics: financeSession?.metrics ?? null,
    sector: option?.sector,
    preloadedFundamentals: getFundamentals(normalized),
  });

  await setCachedStockScreener(data);
  return { ...data, fromCache: false };
}
