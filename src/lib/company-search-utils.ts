import type { CompanySearchResult } from './company-types';

export function toCompanySearchResult(
  ticker: string,
  name: string,
  cik = '',
): CompanySearchResult {
  return { cik, ticker: ticker.toUpperCase(), name };
}
