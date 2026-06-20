/**
 * Sync SEC company_tickers.json into Turso.
 * Run: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/ingest-sec-tickers.mjs
 */
import { createClient } from '@libsql/client';

const SEC_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
const SEC_USER_AGENT = 'Sweep Finance sweep-app/1.0 (isushantkataria@gmail.com)';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

function normalizeCik(cik) {
  return String(cik).replace(/\D/g, '').padStart(10, '0');
}

async function fetchSecCompanies() {
  console.log('Fetching SEC company_tickers.json...');
  const res = await fetch(SEC_TICKERS_URL, {
    headers: { 'User-Agent': SEC_USER_AGENT, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`SEC request failed (${res.status})`);
  }
  const json = await res.json();
  return Object.values(json).map((entry) => ({
    cik: normalizeCik(entry.cik_str),
    ticker: String(entry.ticker).toUpperCase(),
    name: String(entry.title).trim(),
  }));
}

const db = createClient({ url, authToken });

await db.batch([
  `CREATE TABLE IF NOT EXISTS companies (
    cik TEXT PRIMARY KEY,
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_companies_ticker ON companies(ticker)`,
  `CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name)`,
]);

const companies = await fetchSecCompanies();
console.log(`Loaded ${companies.length} companies from SEC.`);

const now = new Date().toISOString();
const batchSize = 200;
let upserted = 0;

for (let i = 0; i < companies.length; i += batchSize) {
  const batch = companies.slice(i, i + batchSize);
  const statements = batch.map((company) => ({
    sql: `
      INSERT INTO companies (cik, ticker, name, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(cik) DO UPDATE SET
        ticker = excluded.ticker,
        name = excluded.name,
        updated_at = excluded.updated_at
    `,
    args: [company.cik, company.ticker, company.name, now],
  }));
  await db.batch(statements);
  upserted += batch.length;
  console.log(`Upserted ${upserted}/${companies.length}`);
}

const count = await db.execute('SELECT COUNT(*) AS count FROM companies');
console.log(`Done. companies table count: ${count.rows[0]?.count ?? 0}`);
