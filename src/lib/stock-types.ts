export type StockFundamentals = {
  marketCap: string;
  peRatio: number | null;
  forwardPe: number | null;
  revenue: string;
  eps: number;
  dividendYield: number | null;
  beta: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  avgVolume: string;
};

export type StockAnalysis = {
  executiveSummary: string;
  keyHighlights: string[];
  valuationAssessment: string;
  momentumAssessment: string;
  strengths: string[];
  riskFactors: string[];
  watchItems: string[];
};

export type StockPeer = {
  name: string;
  metrics: Record<string, number | string>;
};

export type StockSession = {
  ticker: string;
  companyName: string;
  sector: string;
  lastPrice: number;
  currency: string;
  priceHistory: Array<{ label: string; value: number }>;
  fundamentals: StockFundamentals;
  peers: StockPeer[];
  analysis: StockAnalysis;
  loadedAt: number;
  /** True when built from live market data instead of preloaded research profiles. */
  liveData?: boolean;
};

export type StockReportContext = {
  ticker: string;
  companyName: string;
  sector: string;
  lastPrice: number;
  currency: string;
  priceHistory: Array<{ label: string; value: number }>;
  fundamentals: StockFundamentals;
  peers: StockPeer[];
  analysis: StockAnalysis;
};