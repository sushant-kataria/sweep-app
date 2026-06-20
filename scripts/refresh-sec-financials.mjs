/**
 * Daily SEC filing refresh — invalidates Turso cache when new 10-K/10-Q are filed.
 * Run: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/refresh-sec-financials.mjs
 */
import { createClient } from '@libsql/client';

const SEC_USER_AGENT = 'Sweep Finance sweep-app/1.0 (isushantkataria@gmail.com)';
const FORMS = new Set(['10-K', '10-K/A', '10-Q', '10-Q/A']);

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

const db = createClient({ url, authToken });

function quarterForDate(d) {
  return Math.ceil((d.getMonth() + 1) / 3);
}

function padCik(cik) {
  return String(cik).replace(/\D/g, '').padStart(10, '0');
}

function yyyymmdd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

async function fetchDailyIndex(date) {
  const year = date.getFullYear();
  const qtr = quarterForDate(date);
  const stamp = yyyymmdd(date);
  const indexUrl = `https://www.sec.gov/Archives/edgar/daily-index/${year}/QTR${qtr}/master.${stamp}.idx`;

  const res = await fetch(indexUrl, {
    headers: { 'User-Agent': SEC_USER_AGENT, Accept: 'text/plain' },
  });

  if (res.status === 404) {
    console.log(`No index for ${stamp} (weekend/holiday)`);
    return [];
  }
  if (!res.ok) {
    throw new Error(`SEC daily index ${stamp} failed (${res.status})`);
  }

  const text = await res.text();
  const ciks = new Set();

  for (const line of text.split('\n')) {
    if (!line.includes('|')) continue;
    const parts = line.split('|');
    if (parts.length < 4) continue;
    const cik = parts[0]?.trim();
    const form = parts[2]?.trim();
    if (!cik || !/^\d+$/.test(cik) || !FORMS.has(form)) continue;
    ciks.add(padCik(cik));
  }

  return [...ciks];
}

async function invalidateCaches(ciks) {
  if (ciks.length === 0) return { screener: 0, reports: 0 };

  let screener = 0;
  let reports = 0;

  for (const cik of ciks) {
    const s = await db.execute({
      sql: 'DELETE FROM stock_screener_cache WHERE cik = ?',
      args: [cik],
    });
    screener += s.rowsAffected ?? 0;

    const r = await db.execute({
      sql: 'DELETE FROM company_reports WHERE cik = ?',
      args: [cik],
    });
    reports += r.rowsAffected ?? 0;
  }

  return { screener, reports };
}

async function purgeExpired() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const screener = await db.execute({
    sql: 'DELETE FROM stock_screener_cache WHERE fetched_at < ?',
    args: [cutoff],
  });
  const reports = await db.execute({
    sql: 'DELETE FROM company_reports WHERE fetched_at < ?',
    args: [cutoff],
  });
  return {
    screener: screener.rowsAffected ?? 0,
    reports: reports.rowsAffected ?? 0,
  };
}

async function main() {
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

  const expired = await purgeExpired();
  console.log(`Purged expired cache: screener=${expired.screener}, reports=${expired.reports}`);

  const allCiks = new Set();
  const today = new Date();

  for (let daysBack = 0; daysBack < 3; daysBack++) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysBack);
    try {
      const ciks = await fetchDailyIndex(d);
      console.log(`Index ${yyyymmdd(d)}: ${ciks.length} filers with 10-K/10-Q`);
      for (const cik of ciks) allCiks.add(cik);
    } catch (e) {
      console.warn(`Skip ${yyyymmdd(d)}:`, e.message);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const invalidated = await invalidateCaches([...allCiks]);
  console.log(
    `Invalidated ${allCiks.size} CIKs with recent filings: screener=${invalidated.screener}, reports=${invalidated.reports}`,
  );
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
