import type { CompanySearchResult, SecCompany } from './company-types';
import { getTurso, isTursoConfigured } from './turso';

const SEC_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
const SEC_USER_AGENT = 'Sweep Finance sweep-app/1.0 (isushantkataria@gmail.com)';

export function normalizeCik(cik: string | number): string {
  return String(cik).replace(/\D/g, '').padStart(10, '0');
}

export async function getCompanyCount(): Promise<number> {
  if (!isTursoConfigured()) return 0;
  const db = getTurso();
  const result = await db.execute('SELECT COUNT(*) AS count FROM companies');
  return Number(result.rows[0]?.count ?? 0);
}

export async function searchCompanies(query: string, limit = 15): Promise<CompanySearchResult[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  if (isTursoConfigured()) {
    const count = await getCompanyCount();
    if (count > 0) {
      return searchCompaniesTurso(q, limit);
    }
  }

  return searchCompaniesSecFallback(q, limit);
}

async function searchCompaniesTurso(query: string, limit: number): Promise<CompanySearchResult[]> {
  const db = getTurso();
  const upper = query.toUpperCase();
  const tickerPrefix = `${upper}%`;
  const namePattern = `%${query}%`;

  const result = await db.execute({
    sql: `
      SELECT cik, ticker, name
      FROM companies
      WHERE UPPER(ticker) = ?
         OR UPPER(ticker) LIKE ?
         OR name LIKE ? COLLATE NOCASE
      ORDER BY
        CASE
          WHEN UPPER(ticker) = ? THEN 0
          WHEN UPPER(ticker) LIKE ? THEN 1
          ELSE 2
        END,
        LENGTH(ticker),
        ticker
      LIMIT ?
    `,
    args: [upper, tickerPrefix, namePattern, upper, tickerPrefix, limit],
  });

  return result.rows.map((row) => ({
    cik: String(row.cik),
    ticker: String(row.ticker),
    name: String(row.name),
  }));
}

let secTickerCache: SecCompany[] | null = null;
let secTickerCacheAt = 0;
const SEC_CACHE_MS = 24 * 60 * 60 * 1000;

async function loadSecTickerCache(): Promise<SecCompany[]> {
  if (secTickerCache && Date.now() - secTickerCacheAt < SEC_CACHE_MS) {
    return secTickerCache;
  }

  const res = await fetch(SEC_TICKERS_URL, {
    headers: { 'User-Agent': SEC_USER_AGENT, Accept: 'application/json' },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`SEC ticker file unavailable (${res.status}).`);
  }

  const json = (await res.json()) as Record<string, { cik_str: number; ticker: string; title: string }>;
  secTickerCache = Object.values(json).map((entry) => ({
    cik: normalizeCik(entry.cik_str),
    ticker: entry.ticker.toUpperCase(),
    name: entry.title.trim(),
  }));
  secTickerCacheAt = Date.now();
  return secTickerCache;
}

async function searchCompaniesSecFallback(query: string, limit: number): Promise<CompanySearchResult[]> {
  const companies = await loadSecTickerCache();
  const upper = query.toUpperCase();
  const lower = query.toLowerCase();

  const scored = companies
    .map((company) => {
      const ticker = company.ticker.toUpperCase();
      const name = company.name.toLowerCase();
      let score = 99;

      if (ticker === upper) score = 0;
      else if (ticker.startsWith(upper)) score = 1;
      else if (name.includes(lower)) score = 2;
      else return null;

      return { company, score };
    })
    .filter((item): item is { company: SecCompany; score: number } => item !== null)
    .sort((a, b) => a.score - b.score || a.company.ticker.localeCompare(b.company.ticker))
    .slice(0, limit)
    .map((item) => item.company);

  return scored;
}

export async function getCompanyByTicker(ticker: string): Promise<SecCompany | null> {
  const normalized = ticker.trim().toUpperCase();
  if (!normalized) return null;

  if (isTursoConfigured()) {
    const count = await getCompanyCount();
    if (count > 0) {
      const db = getTurso();
      const result = await db.execute({
        sql: 'SELECT cik, ticker, name FROM companies WHERE UPPER(ticker) = ? LIMIT 1',
        args: [normalized],
      });
      const row = result.rows[0];
      if (row) {
        return {
          cik: String(row.cik),
          ticker: String(row.ticker),
          name: String(row.name),
        };
      }
    }
  }

  const companies = await loadSecTickerCache();
  return companies.find((c) => c.ticker === normalized) ?? null;
}

export async function upsertCompanies(companies: SecCompany[]): Promise<number> {
  const db = getTurso();
  const now = new Date().toISOString();
  const batchSize = 200;

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
      args: [company.cik, company.ticker.toUpperCase(), company.name, now],
    }));
    await db.batch(statements);
  }

  return companies.length;
}

export async function fetchSecTickerList(): Promise<SecCompany[]> {
  return loadSecTickerCache();
}
