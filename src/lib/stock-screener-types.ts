/** Screener.in-style stock page data shapes (US SEC adaptation). */

export type FinancialPeriod = {
  key: string;
  label: string;
  end: string;
  form: '10-K' | '10-Q';
  fp?: string;
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
};
