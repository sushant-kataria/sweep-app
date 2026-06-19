export type ReportType = 'balance_sheet';

export type DataSourceType = 'demo' | 'url' | 'excel' | 'csv' | 'pdf';

export type BalanceSheetSection = {
  current: Array<{ label: string; value: number }>;
  nonCurrent: Array<{ label: string; value: number }>;
};

export type BalanceSheetReport = {
  type: 'balance_sheet';
  ticker: string;
  companyName: string;
  period: string;
  currency: string;
  title: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: Array<{ label: string; value: number }>;
  source: string;
  dataSource?: DataSourceType;
  sourceUrl?: string;
  sourceFileName?: string;
};

export type FinanceMetrics = {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  currentAssets: number;
  currentLiabilities: number;
  nonCurrentAssets: number;
  nonCurrentLiabilities: number;
  cashAndEquivalents: number;
  totalDebt: number;
  netDebt: number;
  currentRatio: number | null;
  quickRatio: number | null;
  cashRatio: number | null;
  debtToEquity: number | null;
  debtToAssets: number | null;
  equityRatio: number | null;
  workingCapital: number;
  balanceCheck: number;
  balanceCheckOk: boolean;
};

export type FinanceAnalysis = {
  executiveSummary: string;
  keyHighlights: string[];
  liquidityAssessment: string;
  leverageAssessment: string;
  assetQualityNotes: string;
  strengths: string[];
  riskFactors: string[];
  watchItems: string[];
  analystVerdict: string;
};

export type FinanceSession = {
  report: BalanceSheetReport;
  metrics: FinanceMetrics;
  analysis: FinanceAnalysis;
  generatedAt: number;
};

export type FinanceReportContext = {
  report: BalanceSheetReport;
  metrics: FinanceMetrics;
  analysis: FinanceAnalysis;
};