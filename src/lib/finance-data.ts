import type { BalanceSheetReport } from './finance-types';
import GENERATED from './finance-data-generated.json';
import { FALLBACK_SHEETS } from './finance-data-fallback';

export type CompanyOption = {
  ticker: string;
  name: string;
  periods: string[];
};

/** Top 25 US companies by market cap — display order. */
export const TOP_US_COMPANY_ORDER = [
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'BRK.B', 'TSLA', 'LLY', 'AVGO',
  'JPM', 'WMT', 'V', 'MA', 'XOM', 'UNH', 'COST', 'PG', 'HD', 'JNJ',
  'NFLX', 'CRM', 'AMD', 'KO', 'CVX',
] as const;

type SheetData = Record<string, Record<string, Omit<BalanceSheetReport, 'type'>>>;

const BALANCE_SHEET_DATA: SheetData = {
  ...(GENERATED as SheetData),
  ...FALLBACK_SHEETS,
};

function normalizeTicker(ticker: string) {
  return ticker.toUpperCase().replace('BRK-B', 'BRK.B').trim();
}

export const COMPANY_OPTIONS: CompanyOption[] = TOP_US_COMPANY_ORDER.filter(
  (ticker) => BALANCE_SHEET_DATA[ticker],
).map((ticker) => {
  const periods = Object.keys(BALANCE_SHEET_DATA[ticker]);
  const first = BALANCE_SHEET_DATA[ticker][periods[0]];
  return {
    ticker,
    name: first?.companyName ?? ticker,
    periods,
  };
});

export function getDefaultPeriod(ticker: string): string {
  const normalized = normalizeTicker(ticker);
  const periods = Object.keys(BALANCE_SHEET_DATA[normalized] ?? {});
  return periods[0] ?? '';
}

export function getBalanceSheetReport(ticker: string, period?: string): BalanceSheetReport | null {
  const normalized = normalizeTicker(ticker);
  const sheets = BALANCE_SHEET_DATA[normalized];
  if (!sheets) return null;

  const periodKey = period && sheets[period] ? period : Object.keys(sheets)[0];
  const sheet = sheets[periodKey];
  if (!sheet) return null;

  return { type: 'balance_sheet', ...sheet };
}

export function getPeriodsForTicker(ticker: string): string[] {
  const normalized = normalizeTicker(ticker);
  return Object.keys(BALANCE_SHEET_DATA[normalized] ?? {});
}

export function hasPreloadedReport(ticker: string): boolean {
  return Boolean(BALANCE_SHEET_DATA[normalizeTicker(ticker)]);
}