/**
 * Screener.in-style explore catalog — US SEC filers.
 * Live screens use Yahoo price history formulas; others use curated starter sets + formula docs.
 */

export type FinanceScreenCategory =
  | 'themes'
  | 'formulas'
  | 'price_volume'
  | 'quarterly'
  | 'valuation'
  | 'popular';

export type ScreenMode = 'live' | 'curated';

export type FinanceScreen = {
  id: string;
  title: string;
  description: string;
  category: FinanceScreenCategory;
  mode: ScreenMode;
  /** Standard market formula (display + future batch scans). */
  formula?: string;
  tickers: string[];
};

export type FinanceSector = {
  id: string;
  label: string;
  description: string;
  tickers: string[];
};

export const FINANCE_SCREEN_CATEGORIES: Array<{ id: FinanceScreenCategory; label: string; subtitle?: string }> =
  [
    { id: 'themes', label: 'Popular themes', subtitle: 'Popular investing themes' },
    { id: 'formulas', label: 'Popular formulas', subtitle: 'Screening formulas based on books' },
    { id: 'price_volume', label: 'Price or Volume', subtitle: 'Screens based on price or volume action' },
    { id: 'quarterly', label: 'Quarterly results', subtitle: 'Screens around latest quarterly results' },
    { id: 'valuation', label: 'Valuation screens', subtitle: 'Screens based on stock valuations' },
    { id: 'popular', label: 'Popular stock screens', subtitle: 'Popular screens commonly used by investors' },
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
    tickers: ['GOOGL', 'META', 'NFLX', 'CMCSA', 'T', 'VZ', 'TMUS', 'CHTR', 'EA', 'TTWO', 'OMC'],
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

/** Liquid US SEC filers scanned for live price/volume formulas. */
export const LIVE_SCREEN_UNIVERSE: string[] = [
  ...new Set([
    ...FINANCE_SECTORS.flatMap((s) => s.tickers),
    'TSLA', 'BRK-B', 'V', 'MA', 'AVGO', 'QCOM', 'TXN', 'MU', 'AMAT', 'LRCX', 'KLAC',
    'UBER', 'ABNB', 'PANW', 'CRWD', 'DELL', 'ANET', 'MO', 'PM', 'WBA', 'FCX', 'NUE', 'URI',
  ]),
];

function scr(
  partial: Omit<FinanceScreen, 'tickers'> & { tickers?: string[] },
  tickers: string[],
): FinanceScreen {
  return { ...partial, tickers: partial.tickers ?? tickers };
}

const DIV = ['VZ', 'T', 'MO', 'PM', 'XOM', 'CVX', 'IBM', 'KO', 'PEP', 'JNJ', 'ABBV', 'MRK'];
const GROWTH = ['NVDA', 'META', 'CRM', 'NOW', 'AVGO', 'LLY', 'UBER', 'PANW', 'CRWD', 'SHOP', 'ANET', 'DELL'];
const VALUE = ['F', 'BAC', 'C', 'INTC', 'CVX', 'BMY', 'GILD', 'WBA', 'VZ', 'T', 'GM', 'KEY'];
const QUALITY = ['AAPL', 'MSFT', 'V', 'MA', 'UNH', 'COST', 'HD', 'JNJ', 'PG', 'KO', 'ADBE', 'INTU'];
const MEGA = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'BRK-B', 'JPM', 'V', 'UNH'];
const CAPEX = ['NVDA', 'INTC', 'MU', 'AMAT', 'LRCX', 'CAT', 'DE', 'URI', 'FCX', 'NUE', 'XOM', 'CVX'];
const NEAR_HIGH = ['NVDA', 'META', 'AVGO', 'LLY', 'COST', 'GE', 'NFLX', 'AMAT', 'LRCX', 'KLAC', 'WMT', 'JPM'];

export const FINANCE_SCREENS: FinanceScreen[] = [
  // ── Popular themes ──
  scr(
    {
      id: 'low-on-10yr-earnings',
      title: 'Low on 10 year average earnings',
      description:
        'Graham-style value: price depressed vs long-run earnings power. Verify with 10-K EPS history on the stock page.',
      category: 'themes',
      mode: 'curated',
      formula: 'Price / 10Y average EPS < sector median; positive earnings in ≥7 of last 10 years',
    },
    VALUE,
  ),
  scr(
    {
      id: 'capacity-expansion',
      title: 'Capacity expansion',
      description:
        'Companies undergoing major capacity expansion — fixed assets doubled over 3 years or up >50% in the last year (SEC XBRL).',
      category: 'themes',
      mode: 'curated',
      formula: 'PPE (incl. CWIP) YoY > 50% OR 3Y PPE growth > 100%',
    },
    CAPEX,
  ),
  scr(
    {
      id: 'debt-reduction',
      title: 'Debt reduction',
      description: 'Companies reducing total debt while maintaining operations — check liabilities trend in balance sheet.',
      category: 'themes',
      mode: 'curated',
      formula: 'Total debt (current + non-current) declined YoY; interest coverage > 2×',
    },
    ['AAPL', 'MSFT', 'GOOGL', 'META', 'V', 'MA', 'COST', 'HD', 'JNJ', 'PG', 'ADBE', 'CRM'],
  ),
  scr(
    {
      id: 'companies-creating-new-high',
      title: 'Companies creating new high',
      description: 'Price within 10% of 52-week high — live scan on US large-cap universe.',
      category: 'themes',
      mode: 'live',
      formula: 'Last price ≥ 90% of 52-week high',
    },
    NEAR_HIGH,
  ),
  scr(
    {
      id: 'growth-without-dilution',
      title: 'Growth without dilution',
      description: 'Share count growth <10% over 10 years while revenue grew — verify shares outstanding in EDGAR.',
      category: 'themes',
      mode: 'curated',
      formula: '10Y diluted share count CAGR < 10%; 10Y revenue CAGR > 5%',
    },
    QUALITY,
  ),
  scr(
    {
      id: 'institutional-buying',
      title: 'Institutional buying',
      description:
        'US equivalent of FII buying — large caps with heavy 13F institutional ownership (starter list; verify 13F filings).',
      category: 'themes',
      mode: 'curated',
      formula: 'Institutional ownership > 60% of float (13F aggregate proxy)',
    },
    MEGA,
  ),

  // ── Popular formulas ──
  scr(
    {
      id: 'piotroski-scan',
      title: 'Piotroski Scan',
      description:
        'Nine-point financial strength score (profitability, leverage, efficiency). Score of 8–9 = strong; verify via latest 10-K/20-F.',
      category: 'formulas',
      mode: 'curated',
      formula: 'Piotroski F-Score = 9 (ROA+, CFO+, ΔROA+, accruals-, ΔLeverage-, ΔLiquidity+, no dilution, ΔMargin+, ΔTurnover+)',
    },
    QUALITY,
  ),
  scr(
    {
      id: 'magic-formula',
      title: 'Magic Formula',
      description: 'Greenblatt rank: high earnings yield + high return on capital. Starter large-cap list — rank in stock ratios.',
      category: 'formulas',
      mode: 'curated',
      formula: 'Rank by EY = EBIT/EV and ROC = EBIT/(Net PPE + NWC); top decile intersection',
    },
    ['AAPL', 'MSFT', 'NVDA', 'META', 'GOOGL', 'JPM', 'V', 'UNH', 'HD', 'COST', 'MRK', 'LLY'],
  ),
  scr(
    {
      id: 'coffee-can-portfolio',
      title: 'Coffee Can Portfolio',
      description: 'Buy-and-hold quality compounders — consistent ROE, low leverage, durable moats (Mukherjee / Ambani style).',
      category: 'formulas',
      mode: 'curated',
      formula: 'ROE > 15% for 5+ years; D/E < 0.5; revenue CAGR > 10%',
    },
    ['COST', 'HD', 'V', 'MA', 'UNH', 'JNJ', 'PG', 'KO', 'MSFT', 'AAPL', 'ADBE', 'TMO'],
  ),
  scr(
    {
      id: 'garp-stocks',
      title: 'GARP stocks',
      description: 'Growth at a reasonable price — EPS growth with P/E below high-growth peers.',
      category: 'formulas',
      mode: 'curated',
      formula: 'PEG = P/E / EPS growth < 1.5; EPS growth > 12%',
    },
    GROWTH,
  ),
  scr(
    {
      id: 'quality-businesses',
      title: 'High quality businesses',
      description: 'Good ROCE, profit growth faster than sales, moderate debt.',
      category: 'formulas',
      mode: 'curated',
      formula: 'ROCE > 15%; net profit CAGR > sales CAGR; D/E < 0.25',
    },
    QUALITY,
  ),

  // ── Price or Volume (live) ──
  scr(
    {
      id: 'darvas-scan',
      title: 'Darvas Scan',
      description: 'Within 10% of 52W high, well above 52W low, volume > 100k, price > $10.',
      category: 'price_volume',
      mode: 'live',
      formula: 'Price ≥ 90% of 52W high AND ≥ 150% of 52W low AND volume > 100,000 AND price > $10',
    },
    NEAR_HIGH,
  ),
  scr(
    {
      id: 'golden-crossover',
      title: 'Golden Crossover',
      description: '50-day moving average crosses above 200-day from below.',
      category: 'price_volume',
      mode: 'live',
      formula: 'SMA(50) > SMA(200) AND SMA(50)[t-1] ≤ SMA(200)[t-1]',
    },
    ['GE', 'META', 'NVDA', 'JPM', 'LLY', 'COST', 'WMT', 'UNH', 'AVGO', 'NFLX'],
  ),
  scr(
    {
      id: 'bearish-crossovers',
      title: 'Bearish Crossovers',
      description: '50-day moving average crosses below 200-day from above.',
      category: 'price_volume',
      mode: 'live',
      formula: 'SMA(50) < SMA(200) AND SMA(50)[t-1] ≥ SMA(200)[t-1]',
    },
    ['INTC', 'BA', 'DIS', 'WBA', 'F', 'CVX', 'T', 'VZ', 'BMY', 'GM'],
  ),
  scr(
    {
      id: 'price-volume-action',
      title: 'Price Volume Action',
      description: 'Positive price momentum with elevated volume vs recent baseline.',
      category: 'price_volume',
      mode: 'live',
      formula: '5D avg price > 20D avg price AND volume > 100,000',
    },
    GROWTH,
  ),
  scr(
    {
      id: 'rsi-oversold',
      title: 'RSI - Oversold Stocks',
      description: '14-period RSI below 30 on daily closes.',
      category: 'price_volume',
      mode: 'live',
      formula: 'RSI(14) < 30',
    },
    VALUE,
  ),
  scr(
    {
      id: 'breakout-stocks',
      title: 'Breakout stocks',
      description: 'Same criteria as Darvas — near 52-week highs with liquidity.',
      category: 'price_volume',
      mode: 'live',
      formula: 'Price within 10% of 52W high; volume > 100,000; price > $10',
    },
    NEAR_HIGH,
  ),
  scr(
    {
      id: 'stocks-near-200-dma',
      title: 'Stocks near 200 DMA',
      description: 'Current price within 5% of the 200-day moving average.',
      category: 'price_volume',
      mode: 'live',
      formula: '|Price − SMA(200)| / SMA(200) ≤ 5%',
    },
    MEGA,
  ),

  // ── Quarterly results ──
  scr(
    {
      id: 'bull-cartel',
      title: 'The Bull Cartel',
      description: 'Strong latest quarterly growth — track in quarterly results table on the stock page.',
      category: 'quarterly',
      mode: 'curated',
      formula: 'Latest Q revenue YoY > 15% AND net income YoY > 15%',
    },
    GROWTH,
  ),
  scr(
    {
      id: 'quarterly-growers',
      title: 'Quarterly Growers',
      description: 'Sequential quarterly improvement Q0 > Q1 > Q2 > Q3 in revenue or net income.',
      category: 'quarterly',
      mode: 'curated',
      formula: 'Q0 rev > Q1 rev > Q2 rev > Q3 rev (same fiscal year quarters)',
    },
    ['NVDA', 'META', 'AVGO', 'LLY', 'UBER', 'PANW', 'CRWD', 'ANET', 'DELL', 'SHOP', 'NOW', 'CRM'],
  ),
  scr(
    {
      id: 'best-latest-quarter',
      title: 'Best of latest quarter',
      description: 'Standout latest quarter vs trailing quarters — open ratios on stock page.',
      category: 'quarterly',
      mode: 'curated',
      formula: 'Latest Q EPS beat 4Q trailing average by > 20%',
    },
    GROWTH,
  ),
  scr(
    {
      id: 'all-latest-qtr-results',
      title: 'All Latest QTR Results',
      description: 'Mega-cap filers with fresh 10-Q/10-K — good starting set for quarterly review.',
      category: 'quarterly',
      mode: 'curated',
      formula: 'Most recent quarter filing within 90 days (SEC EDGAR)',
    },
    MEGA,
  ),
  scr(
    {
      id: 'loss-to-profit',
      title: 'Loss to Profit Companies',
      description: 'Turnaround stories — prior quarter loss to current quarter profit (verify in P&L).',
      category: 'quarterly',
      mode: 'curated',
      formula: 'Net income Q-1 < 0 AND net income Q0 > 0',
    },
    ['UBER', 'DELL', 'F', 'GM', 'BA', 'INTC', 'PYPL', 'SNAP', 'RIVN', 'LCID', 'PLTR', 'COIN'],
  ),
  scr(
    {
      id: 'highest-yoy-qtr-profit',
      title: 'Highest YOY Quarterly profit growth',
      description: 'Highest quarter-on-quarter profit growth vs year-ago quarter.',
      category: 'quarterly',
      mode: 'curated',
      formula: '(Net income Q0 − Net income Q0y) / |Net income Q0y| = max in universe',
    },
    GROWTH,
  ),

  // ── Valuation ──
  scr(
    {
      id: 'highest-dividend-yield',
      title: 'Highest Dividend Yield Shares',
      description: 'Consistent dividend payers — confirm yield and payout in cash flow statements.',
      category: 'valuation',
      mode: 'curated',
      formula: 'Dividend yield = annual DPS / price; sorted descending',
    },
    DIV,
  ),
  scr(
    {
      id: 'fcf-yield',
      title: 'FCF yield',
      description: 'Free cash flow yield with growth — FCF / market cap from EDGAR + live price.',
      category: 'valuation',
      mode: 'curated',
      formula: 'FCF yield = TTM FCF / market cap > 4%; FCF YoY > 0',
    },
    ['AAPL', 'MSFT', 'GOOGL', 'META', 'JPM', 'V', 'XOM', 'CVX', 'CSCO', 'IBM', 'INTC', 'F'],
  ),
  scr(
    {
      id: 'book-value-over-price',
      title: 'Book value over 5 times price',
      description: 'Price-to-book below 0.2× — deep value candidates (verify equity from 10-K).',
      category: 'valuation',
      mode: 'curated',
      formula: 'P/B = market cap / book value < 0.2',
    },
    ['BAC', 'C', 'F', 'KEY', 'RF', 'T', 'VZ', 'WBA', 'GM', 'VALE', 'NOK', 'ERIC'],
  ),
  scr(
    {
      id: 'high-growth-roe-low-pe',
      title: 'High Growth High RoE Low PE',
      description: 'Undervalued quality — high ROE with moderate trailing P/E.',
      category: 'valuation',
      mode: 'curated',
      formula: 'ROE > 18%; P/E < 25; EPS growth > 10%',
    },
    ['JPM', 'BAC', 'GS', 'MS', 'UNH', 'COST', 'HD', 'LOW', 'MRK', 'ABBV', 'TXN', 'QCOM'],
  ),
  scr(
    {
      id: 'value-stocks',
      title: 'Value Stocks',
      description: 'High OPM, ROCE, low debt — classic value quality screen.',
      category: 'valuation',
      mode: 'curated',
      formula: 'OPM > 15%; ROCE > 12%; D/E < 1.0',
    },
    VALUE,
  ),
  scr(
    {
      id: 'debt-free-companies',
      title: 'Debt free companies',
      description: 'Net cash or minimal debt — large-cap SEC filers with strong balance sheets.',
      category: 'valuation',
      mode: 'curated',
      formula: 'Total debt − cash < 0 OR D/E < 0.1',
    },
    ['AAPL', 'MSFT', 'GOOGL', 'META', 'V', 'MA', 'ADBE', 'CRM', 'NOW', 'INTU', 'CSCO', 'ORCL'],
  ),
  scr(
    {
      id: 'undervalued-stocks',
      title: 'Undervalued stocks',
      description: 'Moderate P/E with solid return on capital — starter large/mid caps.',
      category: 'valuation',
      mode: 'curated',
      formula: 'P/E < 15; ROIC > 12%; market cap > $2B',
    },
    ['JPM', 'BAC', 'WFC', 'C', 'XOM', 'CVX', 'INTC', 'F', 'GM', 'T', 'VZ', 'BMY'],
  ),
  scr(
    {
      id: 'bluest-blue-chips',
      title: 'Bluest of the Blue Chips',
      description: 'Large caps with solid profit growth, ROE, and reasonable valuations.',
      category: 'valuation',
      mode: 'curated',
      formula: 'Market cap > $100B; ROE > 15%; 5Y EPS CAGR > 8%',
    },
    MEGA,
  ),

  // ── Popular stock screens (highlights) ──
  scr(
    {
      id: 'growth-stocks',
      title: 'Growth Stocks',
      description: 'High growth at reasonable price — G Factor style score from quarterly earnings quality.',
      category: 'popular',
      mode: 'curated',
      formula: 'G-Factor: recent quarterly growth + earnings quality score (0–10)',
    },
    GROWTH,
  ),
  scr(
    {
      id: 'low-from-52w-high',
      title: 'Low from 52 week high',
      description: 'Stocks >25% below 52-week high — potential pullback watchlist (live scan).',
      category: 'popular',
      mode: 'live',
      formula: 'Price ≤ 75% of 52-week high',
    },
    VALUE,
  ),
  scr(
    {
      id: 'good-stocks-near-52w-low',
      title: 'Good stocks near 52 week low',
      description: 'Quality names closer to 52-week lows — verify fundamentals before averaging in.',
      category: 'popular',
      mode: 'live',
      formula: 'Price within 15% of 52W low; avg volume > 300k',
    },
    ['INTC', 'BA', 'DIS', 'WBA', 'F', 'CVX', 'T', 'VZ', 'BMY', 'GM', 'NKE', 'SBUX'],
  ),
  scr(
    {
      id: 'multibagger-ideas',
      title: 'Multibagger ideas',
      description: 'High growth + high ROCE quality screen — speculative mid/high growth starter list.',
      category: 'popular',
      mode: 'curated',
      formula: 'Revenue CAGR > 15%; ROCE > 20%',
    },
    ['NVDA', 'META', 'AVGO', 'LLY', 'UBER', 'PANW', 'CRWD', 'ANET', 'DELL', 'SHOP', 'APP', 'PLTR'],
  ),
  scr(
    {
      id: 'fundamentally-strong',
      title: 'Fundamentally strong stocks',
      description: 'Solid balance sheet, consistent profitability, and positive cash flow.',
      category: 'popular',
      mode: 'curated',
      formula: 'Current ratio > 1.2; positive FCF 3Y; net margin > 5%',
    },
    QUALITY,
  ),
  scr(
    {
      id: 'canslim-style',
      title: 'CANSLIM style',
      description: 'William O\'Neil framework adapted — strong quarterly sales/EPS growth + price strength.',
      category: 'popular',
      mode: 'curated',
      formula: 'Q sales YoY ≥ 25%; Q EPS YoY ≥ 25%; RS near highs',
    },
    GROWTH,
  ),
  scr(
    {
      id: 'peter-lynch-growth',
      title: 'Peter Lynch growth',
      description: 'Fast growers — profitable, reasonable debt, under-followed mid caps (starter set).',
      category: 'popular',
      mode: 'curated',
      formula: 'EPS growth 20–50%; PEG < 1.5; D/E < 0.5',
    },
    ['DELL', 'ANET', 'PANW', 'CRWD', 'UBER', 'ABNB', 'SHOP', 'SNOW', 'DDOG', 'NET', 'MELI', 'CPNG'],
  ),
];

export function getScreenById(id: string): FinanceScreen | undefined {
  return FINANCE_SCREENS.find((s) => s.id === id);
}

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
      s.formula?.toLowerCase().includes(q) ||
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
