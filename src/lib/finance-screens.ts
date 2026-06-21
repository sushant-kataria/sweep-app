/** Screener.in-style explore catalog — US SEC filers (curated ticker lists). */

export type FinanceScreenCategory =
  | 'popular'
  | 'valuation'
  | 'quarterly'
  | 'themes';

export type FinanceScreen = {
  id: string;
  title: string;
  description: string;
  category: FinanceScreenCategory;
  tickers: string[];
};

export type FinanceSector = {
  id: string;
  label: string;
  description: string;
  tickers: string[];
};

export const FINANCE_SCREEN_CATEGORIES: Array<{ id: FinanceScreenCategory; label: string }> = [
  { id: 'popular', label: 'Popular stock screens' },
  { id: 'themes', label: 'Popular themes' },
  { id: 'valuation', label: 'Valuation screens' },
  { id: 'quarterly', label: 'Quarterly results' },
];

export const FINANCE_SECTORS: FinanceSector[] = [
  {
    id: 'technology',
    label: 'Technology',
    description: 'Software, semiconductors, and IT services',
    tickers: ['AAPL', 'MSFT', 'NVDA', 'ORCL', 'CRM', 'ADBE', 'INTC', 'AMD', 'IBM', 'CSCO', 'NOW', 'SNOW'],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    description: 'Pharma, biotech, and health services',
    tickers: ['JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'LLY', 'TMO', 'ABT', 'BMY', 'AMGN', 'GILD', 'ISRG'],
  },
  {
    id: 'financials',
    label: 'Financials',
    description: 'Banks, insurance, and asset managers',
    tickers: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'MET', 'SPGI', 'ICE'],
  },
  {
    id: 'consumer',
    label: 'Consumer',
    description: 'Retail, staples, and discretionary',
    tickers: ['WMT', 'COST', 'HD', 'MCD', 'NKE', 'KO', 'PEP', 'PG', 'SBUX', 'TGT', 'LOW', 'DIS'],
  },
  {
    id: 'communication',
    label: 'Communication',
    description: 'Media, telecom, and platforms',
    tickers: ['GOOGL', 'META', 'NFLX', 'CMCSA', 'T', 'VZ', 'TMUS', 'DIS', 'CHTR', 'EA', 'TTWO', 'OMC'],
  },
  {
    id: 'industrials',
    label: 'Industrials',
    description: 'Manufacturing, transport, and defense',
    tickers: ['CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'BA', 'DE', 'UNP', 'MMM', 'FDX', 'EMR'],
  },
  {
    id: 'energy',
    label: 'Energy',
    description: 'Oil, gas, and energy equipment',
    tickers: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL', 'KMI', 'WMB'],
  },
  {
    id: 'real-estate',
    label: 'Real estate',
    description: 'REITs and property operators',
    tickers: ['PLD', 'AMT', 'EQIX', 'SPG', 'O', 'PSA', 'WELL', 'DLR', 'AVB', 'EQR', 'VICI', 'ARE'],
  },
];

export const FINANCE_SCREENS: FinanceScreen[] = [
  {
    id: 'mega-cap',
    title: 'Mega-cap leaders',
    description: 'Largest US-listed SEC filers by market profile — liquid large caps for baseline research.',
    category: 'popular',
    tickers: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'BRK-B', 'JPM', 'V', 'UNH'],
  },
  {
    id: 'growth-tech',
    title: 'Growth stocks',
    description: 'High-growth technology and platform names — compare revenue trends in SEC XBRL tables.',
    category: 'popular',
    tickers: ['NVDA', 'META', 'CRM', 'NOW', 'SNOW', 'PANW', 'CRWD', 'DDOG', 'SHOP', 'UBER'],
  },
  {
    id: 'dividend-yield',
    title: 'Highest dividend yield',
    description: 'Consistent cash-return names — verify payout and coverage in cash flow statements.',
    category: 'popular',
    tickers: ['VZ', 'T', 'MO', 'PM', 'XOM', 'CVX', 'IBM', 'KO', 'PEP', 'JNJ'],
  },
  {
    id: 'near-high',
    title: 'Companies creating new high',
    description: 'Large caps often in focus during 52-week high runs — open chart on stock page for price action.',
    category: 'themes',
    tickers: ['NVDA', 'META', 'AVGO', 'LLY', 'COST', 'GE', 'NFLX', 'AMAT', 'LRCX', 'KLAC'],
  },
  {
    id: 'value-candidates',
    title: 'Value candidates',
    description: 'Lower-multiple legacy franchises — cross-check P/E and book value in key metrics.',
    category: 'valuation',
    tickers: ['F', 'BAC', 'C', 'INTC', 'CVX', 'WBA', 'VZ', 'T', 'BMY', 'GILD'],
  },
  {
    id: 'low-debt',
    title: 'Strong balance sheets',
    description: 'Names often cited for net cash or moderate leverage — verify debt/equity in ratios.',
    category: 'valuation',
    tickers: ['AAPL', 'MSFT', 'GOOGL', 'META', 'V', 'MA', 'ADBE', 'CRM', 'NOW', 'INTU'],
  },
  {
    id: 'recent-filers',
    title: 'Latest quarterly results',
    description: 'Mega-cap filers with frequent 10-Q/10-K updates — good for testing quarterly tables.',
    category: 'quarterly',
    tickers: ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'JPM', 'WMT', 'HD', 'NKE'],
  },
  {
    id: 'qtr-growers',
    title: 'Quarterly growers',
    description: 'Track QoQ revenue and profit in screener tables — sample large-cap growth names.',
    category: 'quarterly',
    tickers: ['NVDA', 'META', 'AVGO', 'LLY', 'UBER', 'ABNB', 'PANW', 'CRWD', 'DELL', 'ANET'],
  },
  {
    id: 'capacity-expansion',
    title: 'Capacity expansion',
    description: 'Capex-heavy businesses — review fixed assets and cash flow investing in filings.',
    category: 'themes',
    tickers: ['TSM', 'INTC', 'MU', 'AMAT', 'LRCX', 'CAT', 'DE', 'URI', 'FCX', 'NUE'],
  },
  {
    id: 'fii-proxy',
    title: 'Institutional favorites',
    description: 'Highly held US equities — useful starting set for peer and holder research.',
    category: 'themes',
    tickers: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'BRK-B', 'JPM', 'XOM', 'JNJ', 'V'],
  },
];

export function getScreensByCategory(category: FinanceScreenCategory): FinanceScreen[] {
  return FINANCE_SCREENS.filter((s) => s.category === category);
}

export function searchFinanceScreens(query: string): FinanceScreen[] {
  const q = query.trim().toLowerCase();
  if (!q) return FINANCE_SCREENS;
  return FINANCE_SCREENS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tickers.some((t) => t.toLowerCase().includes(q)),
  );
}

export function searchFinanceSectors(query: string): FinanceSector[] {
  const q = query.trim().toLowerCase();
  if (!q) return FINANCE_SECTORS;
  return FINANCE_SECTORS.filter(
    (s) =>
      s.label.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tickers.some((t) => t.toLowerCase().includes(q)),
  );
}
