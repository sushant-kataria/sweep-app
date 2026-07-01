/**
 * Create Turso tables for Phase 1.
 * Run: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/init-turso-schema.mjs
 */
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

const db = createClient({ url, authToken });

const statements = [
  `CREATE TABLE IF NOT EXISTS companies (
    cik TEXT PRIMARY KEY,
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_companies_ticker ON companies(ticker)`,
  `CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name)`,
  `CREATE TABLE IF NOT EXISTS company_reports (
    cik TEXT PRIMARY KEY,
    ticker TEXT NOT NULL,
    period_key TEXT NOT NULL,
    session_json TEXT NOT NULL,
    fetched_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_company_reports_ticker ON company_reports(ticker)`,
  `CREATE TABLE IF NOT EXISTS market_snapshots (
    cache_key TEXT PRIMARY KEY,
    ticker TEXT NOT NULL,
    range_key TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    fetched_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_market_snapshots_ticker ON market_snapshots(ticker)`,
  `CREATE TABLE IF NOT EXISTS stock_screener_cache (
    cik TEXT PRIMARY KEY,
    ticker TEXT NOT NULL,
    screener_json TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    parser_version INTEGER NOT NULL,
    latest_filing_date TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_stock_screener_ticker ON stock_screener_cache(ticker)`,
  `CREATE TABLE IF NOT EXISTS subscriptions (
    workos_user_id TEXT PRIMARY KEY,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL,
    price_id TEXT,
    current_period_end TEXT,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id)`,
];

for (const sql of statements) {
  await db.execute(sql);
  console.log('OK:', sql.split('\n')[0]);
}

const count = await db.execute('SELECT COUNT(*) AS count FROM companies');
console.log(`Companies in database: ${count.rows[0]?.count ?? 0}`);
