import type { FinanceSession } from './finance-types';
import { getTurso, isTursoConfigured } from './turso';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** Increment when balance-sheet parsing changes so cached sessions are refreshed. */
export const REPORT_PARSER_VERSION = 2;

export async function ensureReportCacheTable(): Promise<void> {
  if (!isTursoConfigured()) return;
  const db = getTurso();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS company_reports (
      cik TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      period_key TEXT NOT NULL,
      session_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_company_reports_ticker ON company_reports(ticker)`);
}

export async function getCachedFinanceSession(cik: string): Promise<FinanceSession | null> {
  if (!isTursoConfigured()) return null;
  try {
    await ensureReportCacheTable();
    const db = getTurso();
    const result = await db.execute({
      sql: 'SELECT session_json, fetched_at FROM company_reports WHERE cik = ? LIMIT 1',
      args: [cik],
    });
    const row = result.rows[0];
    if (!row) return null;

    const fetchedAt = new Date(String(row.fetched_at)).getTime();
    if (!Number.isFinite(fetchedAt) || Date.now() - fetchedAt > CACHE_TTL_MS) {
      return null;
    }

    const session = JSON.parse(String(row.session_json)) as FinanceSession;
    if (!isCacheSessionValid(session)) return null;
    return session;
  } catch {
    return null;
  }
}

function isCacheSessionValid(session: FinanceSession): boolean {
  return session.parserVersion === REPORT_PARSER_VERSION;
}

export async function setCachedFinanceSession(
  cik: string,
  ticker: string,
  periodKey: string,
  session: FinanceSession,
): Promise<void> {
  if (!isTursoConfigured()) return;
  try {
    await ensureReportCacheTable();
    const db = getTurso();
    await db.execute({
      sql: `
        INSERT INTO company_reports (cik, ticker, period_key, session_json, fetched_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(cik) DO UPDATE SET
          ticker = excluded.ticker,
          period_key = excluded.period_key,
          session_json = excluded.session_json,
          fetched_at = excluded.fetched_at
      `,
      args: [cik, ticker.toUpperCase(), periodKey, JSON.stringify(session), new Date().toISOString()],
    });
  } catch (e) {
    console.warn('[finance-report-cache] write failed', e);
  }
}
