/** Screener.in-style stock page data shapes (US SEC adaptation). */

/** Screener fundamentals refresh at least once per day. */
export const SCREENER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Bump when screener parsing shape changes — invalidates Turso cache rows. */
export const SCREENER_PARSER_VERSION = 2;

export type FinancialPeriod = {
  key: string;
  label: string;
  end: string;
  form: '10-K' | '10-Q' | '20-F' | '6-K';
  fp?: string;
  frame?: string | null;
};

export type FinancialTable = {
  title: string;
  subtitle?: string;
  unit: string;
  periods: FinancialPeriod[];
  rows: Array<{
    label: string;
    values: Array<number | null>;
    highlight?: boolean;
  }>;
};

export type GrowthStat = {
  label: string;
  value: string;
};

export type StockKeyMetric = {
  label: string;
  value: string;
  hint?: string;
};

export type StockProsCons = {
  pros: string[];
  cons: string[];
};

export type StockDocumentLink = {
  label: string;
  url: string;
  date?: string;
};

export type StockScreenerData = {
  ticker: string;
  companyName: string;
  cik: string;
  sector: string;
  about?: string;
  keyMetrics: StockKeyMetric[];
  quarterlyResults: FinancialTable;
  profitAndLoss: FinancialTable;
  balanceSheet: FinancialTable;
  cashFlow: FinancialTable;
  ratios: FinancialTable;
  growthStats: GrowthStat[];
  prosCons: StockProsCons;
  documents: StockDocumentLink[];
  financeReportUrl: string;
  loadedAt: number;
  /** Unix ms when this payload expires (24h cache). */
  expiresAt: number;
  /** ISO timestamp of last market price used in summary. */
  marketAsOf?: string | null;
  /** Most recent SEC 10-K/10-Q filing date in documents list. */
  latestFilingDate?: string | null;
  /** True when served from Turso cache. */
  fromCache?: boolean;
};
