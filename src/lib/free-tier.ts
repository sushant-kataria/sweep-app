import { TOP_US_COMPANY_ORDER } from '@/lib/finance-data';

/** Max result rows for screen previews on the free tier. */
export const FREE_SAMPLE_ROWS = 5;

/** Preloaded finance balance sheets available without Pro. */
export const FREE_FINANCE_TICKERS = new Set<string>(TOP_US_COMPANY_ORDER);

/** Stock tickers with full terminal + chat context samples (charts + SEC tables). */
export const FREE_STOCK_TICKERS = new Set([
  'AAPL',
  'NVDA',
  'MSFT',
  'AMZN',
  'TSLA',
  'META',
  'GOOGL',
  'JPM',
]);

/** Real estate screen shown as a free sample on the explorer. */
export const FREE_RE_SAMPLE_SCREEN_ID = 'top-deals';

export function isFreeFinanceTicker(ticker: string): boolean {
  return FREE_FINANCE_TICKERS.has(ticker.toUpperCase().replace('BRK-B', 'BRK.B'));
}

export function isFreeStockTicker(ticker: string): boolean {
  return FREE_STOCK_TICKERS.has(ticker.toUpperCase());
}
