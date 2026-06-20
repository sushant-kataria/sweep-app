export type MarketRange = '6mo' | '1y' | '5y';

export type MarketHistoryPoint = {
  label: string;
  value: number;
};

export type MarketSnapshot = {
  ticker: string;
  currency: string;
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  marketCap: number | null;
  peRatio: number | null;
  asOf: string;
  source: 'yahoo' | 'finnhub';
  range: MarketRange;
  history: MarketHistoryPoint[];
};
