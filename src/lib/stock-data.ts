import type { StockAnalysis, StockFundamentals, StockPeer } from './stock-types';

export type StockOption = {
  ticker: string;
  name: string;
  sector: string;
};

export const DEFAULT_STOCK_TICKER = 'AAPL';

export const STOCK_OPTIONS: StockOption[] = [
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
  { ticker: 'META', name: 'Meta Platforms Inc.', sector: 'Communication Services' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication Services' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials' },
];

export const STOCK_SECTORS = [...new Set(STOCK_OPTIONS.map((s) => s.sector))].sort();

const PRICE_HISTORY: Record<string, Array<{ label: string; value: number }>> = {
  AAPL: [
    { label: '2018', value: 39 },
    { label: '2019', value: 73 },
    { label: '2020', value: 132 },
    { label: '2021', value: 178 },
    { label: '2022', value: 130 },
    { label: '2023', value: 193 },
    { label: '2024', value: 250 },
  ],
  NVDA: [
    { label: '2018', value: 3.2 },
    { label: '2019', value: 5.9 },
    { label: '2020', value: 13.1 },
    { label: '2021', value: 29.4 },
    { label: '2022', value: 14.6 },
    { label: '2023', value: 49.5 },
    { label: '2024', value: 138 },
  ],
  MSFT: [
    { label: '2018', value: 101 },
    { label: '2019', value: 157 },
    { label: '2020', value: 217 },
    { label: '2021', value: 336 },
    { label: '2022', value: 239 },
    { label: '2023', value: 376 },
    { label: '2024', value: 421 },
  ],
  AMZN: [
    { label: '2018', value: 75 },
    { label: '2019', value: 92 },
    { label: '2020', value: 163 },
    { label: '2021', value: 171 },
    { label: '2022', value: 84 },
    { label: '2023', value: 152 },
    { label: '2024', value: 219 },
  ],
  TSLA: [
    { label: '2018', value: 20 },
    { label: '2019', value: 28 },
    { label: '2020', value: 235 },
    { label: '2021', value: 352 },
    { label: '2022', value: 123 },
    { label: '2023', value: 248 },
    { label: '2024', value: 403 },
  ],
  META: [
    { label: '2018', value: 131 },
    { label: '2019', value: 205 },
    { label: '2020', value: 273 },
    { label: '2021', value: 336 },
    { label: '2022', value: 120 },
    { label: '2023', value: 353 },
    { label: '2024', value: 585 },
  ],
  GOOGL: [
    { label: '2018', value: 52 },
    { label: '2019', value: 68 },
    { label: '2020', value: 88 },
    { label: '2021', value: 140 },
    { label: '2022', value: 88 },
    { label: '2023', value: 140 },
    { label: '2024', value: 192 },
  ],
  JPM: [
    { label: '2018', value: 97 },
    { label: '2019', value: 139 },
    { label: '2020', value: 127 },
    { label: '2021', value: 158 },
    { label: '2022', value: 134 },
    { label: '2023', value: 170 },
    { label: '2024', value: 239 },
  ],
};

const FUNDAMENTALS: Record<string, StockFundamentals> = {
  AAPL: {
    marketCap: '$3.5T',
    peRatio: 34.2,
    forwardPe: 29.8,
    revenue: '$391B',
    eps: 6.42,
    dividendYield: 0.44,
    beta: 1.24,
    fiftyTwoWeekHigh: 260,
    fiftyTwoWeekLow: 164,
    avgVolume: '58M',
  },
  NVDA: {
    marketCap: '$3.0T',
    peRatio: 65.1,
    forwardPe: 42.3,
    revenue: '$61B',
    eps: 2.94,
    dividendYield: 0.03,
    beta: 1.68,
    fiftyTwoWeekHigh: 152,
    fiftyTwoWeekLow: 39,
    avgVolume: '42M',
  },
  MSFT: {
    marketCap: '$3.1T',
    peRatio: 35.8,
    forwardPe: 31.2,
    revenue: '$245B',
    eps: 11.8,
    dividendYield: 0.72,
    beta: 0.89,
    fiftyTwoWeekHigh: 468,
    fiftyTwoWeekLow: 362,
    avgVolume: '22M',
  },
  AMZN: {
    marketCap: '$2.1T',
    peRatio: 44.5,
    forwardPe: 36.1,
    revenue: '$638B',
    eps: 5.53,
    dividendYield: null,
    beta: 1.15,
    fiftyTwoWeekHigh: 242,
    fiftyTwoWeekLow: 151,
    avgVolume: '38M',
  },
  TSLA: {
    marketCap: '$1.2T',
    peRatio: 112.4,
    forwardPe: 89.2,
    revenue: '$97B',
    eps: 3.62,
    dividendYield: null,
    beta: 2.31,
    fiftyTwoWeekHigh: 488,
    fiftyTwoWeekLow: 138,
    avgVolume: '95M',
  },
  META: {
    marketCap: '$1.4T',
    peRatio: 26.4,
    forwardPe: 22.1,
    revenue: '$165B',
    eps: 22.6,
    dividendYield: 0.35,
    beta: 1.22,
    fiftyTwoWeekHigh: 638,
    fiftyTwoWeekLow: 312,
    avgVolume: '15M',
  },
  GOOGL: {
    marketCap: '$2.0T',
    peRatio: 24.8,
    forwardPe: 21.5,
    revenue: '$350B',
    eps: 7.52,
    dividendYield: 0.48,
    beta: 1.05,
    fiftyTwoWeekHigh: 208,
    fiftyTwoWeekLow: 130,
    avgVolume: '24M',
  },
  JPM: {
    marketCap: '$680B',
    peRatio: 12.1,
    forwardPe: 11.4,
    revenue: '$162B',
    eps: 17.8,
    dividendYield: 2.1,
    beta: 1.08,
    fiftyTwoWeekHigh: 256,
    fiftyTwoWeekLow: 135,
    avgVolume: '9M',
  },
};

const ANALYSIS: Record<string, StockAnalysis> = {
  AAPL: {
    executiveSummary:
      'Apple remains a cash-generative platform business with a premium hardware ecosystem and growing services mix. Valuation embeds durable brand loyalty and recurring revenue, though iPhone cycle sensitivity and China exposure warrant monitoring.',
    keyHighlights: [
      'Services revenue now exceeds $90B annualized with higher margins than hardware.',
      'Net cash position and buyback program support EPS growth despite modest unit growth.',
      'Vision Pro and on-device AI roadmap extend the ecosystem moat.',
    ],
    valuationAssessment:
      'Trading near 34x trailing earnings — a premium to mega-cap tech median but supported by capital return and services mix shift. Forward multiple compresses if AI-driven upgrade cycle materializes.',
    momentumAssessment:
      'Price recovered strongly from 2022 drawdown; 2024 close at $250 reflects AI optimism and resilient iPhone demand. Range-bound action possible near prior highs.',
    strengths: ['Ecosystem lock-in', 'Services margin expansion', 'Balance sheet strength'],
    riskFactors: ['China demand volatility', 'Regulatory pressure on App Store', 'Hardware cycle timing'],
    watchItems: ['iPhone 17 launch uptake', 'Services attach rate', 'Greater China revenue trend'],
  },
  NVDA: {
    executiveSummary:
      'NVIDIA dominates AI accelerator demand with CUDA software moat and full-stack data center platform. Revenue scaled rapidly on hyperscaler capex, but valuation reflects peak-cycle expectations.',
    keyHighlights: [
      'Data center segment drives majority of revenue with 70%+ gross margins.',
      'Blackwell platform extends lead in training and inference workloads.',
      'Customer concentration among top cloud providers creates demand visibility and risk.',
    ],
    valuationAssessment:
      'Premium multiples reflect AI TAM expansion but leave little room for capex digestion or competitive share loss. Peer-relative P/E is elevated even within semiconductors.',
    momentumAssessment:
      'Multi-year uptrend with sharp 2022 reset; 2024 performance reflects AI narrative dominance. High beta amplifies macro and rate sensitivity.',
    strengths: ['CUDA ecosystem', 'Full-stack platform', 'Hyperscaler design wins'],
    riskFactors: ['Capex cycle normalization', 'Custom silicon competition', 'Export controls'],
    watchItems: ['Data center revenue growth rate', 'China alternative supply chains', 'Gross margin trajectory'],
  },
  MSFT: {
    executiveSummary:
      'Microsoft combines enterprise software durability with Azure cloud scale and Copilot monetization optionality. Balanced growth across productivity, cloud, and gaming with conservative balance sheet management.',
    keyHighlights: [
      'Azure growth re-accelerated on AI workload demand.',
      'Office 365 seat expansion and Copilot upsell improve ARPU.',
      'Activision integration broadens content and Game Pass subscription base.',
    ],
    valuationAssessment:
      'Trades at a quality premium with lower beta than pure-play AI names. Multiple supported by recurring revenue mix and operating leverage.',
    momentumAssessment:
      'Steady compounder profile — limited deep drawdowns relative to semis. 2024 highs reflect cloud + AI positioning.',
    strengths: ['Enterprise distribution', 'Azure scale', 'Recurring revenue base'],
    riskFactors: ['Cloud competition', 'Copilot adoption pace', 'Regulatory scrutiny'],
    watchItems: ['Azure growth deceleration', 'Copilot attach metrics', 'CapEx intensity'],
  },
  AMZN: {
    executiveSummary:
      'Amazon pairs e-commerce scale with high-growth AWS and advertising. Margin expansion from cost discipline and advertising mix improves ROIC after 2022 efficiency reset.',
    keyHighlights: [
      'AWS remains primary profit engine with AI infrastructure investments.',
      'Advertising revenue growing faster than retail with minimal capex.',
      'Fulfillment regionalization improved delivery speed and unit economics.',
    ],
    valuationAssessment:
      'Multiple reflects AWS optionality more than retail margins. Reasonable vs historical range if AWS growth sustains mid-teens.',
    momentumAssessment:
      'Recovered from 2022 trough; retail and cloud optimism drove 2023–2024 rebound.',
    strengths: ['AWS leadership', 'Logistics network', 'Advertising flywheel'],
    riskFactors: ['Retail margin pressure', 'AWS price competition', 'Labor and regulatory costs'],
    watchItems: ['AWS operating margin', 'North America retail profitability', 'AI capex ROI'],
  },
  TSLA: {
    executiveSummary:
      'Tesla leads EV volume with vertical integration but faces margin compression from price cuts and intensifying competition. Energy storage and FSD optionality remain long-dated catalysts.',
    keyHighlights: [
      'Global EV share leadership with manufacturing scale in US, China, and Europe.',
      'Energy generation and storage growing off a smaller base.',
      'FSD and robotaxi narrative drives valuation dispersion vs auto peers.',
    ],
    valuationAssessment:
      'Equity priced as a tech platform rather than automaker — extreme P/E vs industry. Requires autonomous or energy breakthrough to justify sustained premium.',
    momentumAssessment:
      'Highly volatile — 2021 peak, 2022 collapse, partial recovery on AI/robotaxi headlines.',
    strengths: ['Brand and charging network', 'Battery cost curve', 'Software OTA capability'],
    riskFactors: ['Price war in China', 'Margin erosion', 'Execution on autonomy'],
    watchItems: ['Automotive gross margin', 'Cybertruck ramp', 'China wholesale deliveries'],
  },
  META: {
    executiveSummary:
      'Meta rebuilt investor confidence via efficiency program and AI-driven ad targeting. Reels monetization and Advantage+ products improved ROAS for advertisers while Reality Labs remains a long-term bet.',
    keyHighlights: [
      'Operating margin expanded after 2023 cost restructuring.',
      'AI recommendation systems lifted engagement and ad yield.',
      'WhatsApp and messaging monetization still early innings.',
    ],
    valuationAssessment:
      'Re-rated from distressed 2022 levels; now trades at reasonable mega-cap multiple if ad growth sustains.',
    momentumAssessment:
      'Sharp V-recovery from 2022 lows; momentum tied to digital ad cycle and AI capex narrative.',
    strengths: ['Global user scale', 'AI ad stack', 'Free cash flow generation'],
    riskFactors: ['Reality Labs losses', 'Privacy regulation', 'TikTok competition'],
    watchItems: ['Ad revenue growth', 'Reality Labs burn', 'EU regulatory outcomes'],
  },
  GOOGL: {
    executiveSummary:
      'Alphabet owns search cash flows and is repositioning around Gemini AI across Search, Cloud, and YouTube. Antitrust overhang and cloud profitability path are key swing factors.',
    keyHighlights: [
      'Search remains dominant with AI Overviews changing query monetization.',
      'Google Cloud approaching sustained profitability with AI workloads.',
      'YouTube ad and subscription revenue diversifies beyond search.',
    ],
    valuationAssessment:
      'Trades at discount to mega-cap peers — antitrust discount may persist until clarity on remedies.',
    momentumAssessment:
      'Range-bound post-2021 peak; AI product launches drive episodic rallies.',
    strengths: ['Search moat', 'YouTube scale', 'AI research depth'],
    riskFactors: ['Antitrust remedies', 'Search disruption risk', 'Cloud share vs AWS/Azure'],
    watchItems: ['Cloud operating margin', 'Search revenue per query', 'DOJ remedy timeline'],
  },
  JPM: {
    executiveSummary:
      'JPMorgan is the US universal bank benchmark with diversified earnings across CIB, consumer, and asset management. Net interest income benefited from higher rates while credit quality remains orderly.',
    keyHighlights: [
      'Fortress balance sheet with best-in-class CET1 and liquidity.',
      'Investment banking share gains in volatile markets.',
      'Consumer deposits provide low-cost funding advantage.',
    ],
    valuationAssessment:
      'Trades at modest premium to bank peers justified by ROE and deposit franchise. Rate-cut cycle may compress NII.',
    momentumAssessment:
      'Steady grind higher with lower volatility than tech — rate path is primary driver.',
    strengths: ['Deposit franchise', 'Diversified earnings', 'Risk management culture'],
    riskFactors: ['Credit cycle turn', 'Regulatory capital rules', 'NII normalization'],
    watchItems: ['Net charge-off trends', 'CET1 ratio', 'Fed rate path'],
  },
};

const PEER_SETS: Record<string, StockPeer[]> = {
  AAPL: [
    { name: 'AAPL', metrics: { 'P/E': 34.2, 'Mkt Cap ($B)': 3500, 'Rev ($B)': 391, Beta: 1.24 } },
    { name: 'MSFT', metrics: { 'P/E': 35.8, 'Mkt Cap ($B)': 3100, 'Rev ($B)': 245, Beta: 0.89 } },
    { name: 'GOOGL', metrics: { 'P/E': 24.8, 'Mkt Cap ($B)': 2000, 'Rev ($B)': 350, Beta: 1.05 } },
  ],
  NVDA: [
    { name: 'NVDA', metrics: { 'P/E': 65.1, 'Mkt Cap ($B)': 3000, 'Rev ($B)': 61, Beta: 1.68 } },
    { name: 'AMD', metrics: { 'P/E': 48.2, 'Mkt Cap ($B)': 220, 'Rev ($B)': 26, Beta: 1.92 } },
    { name: 'AVGO', metrics: { 'P/E': 28.4, 'Mkt Cap ($B)': 780, 'Rev ($B)': 52, Beta: 1.12 } },
  ],
  MSFT: [
    { name: 'MSFT', metrics: { 'P/E': 35.8, 'Mkt Cap ($B)': 3100, 'Rev ($B)': 245, Beta: 0.89 } },
    { name: 'ORCL', metrics: { 'P/E': 32.1, 'Mkt Cap ($B)': 420, 'Rev ($B)': 57, Beta: 0.95 } },
    { name: 'CRM', metrics: { 'P/E': 42.5, 'Mkt Cap ($B)': 310, 'Rev ($B)': 38, Beta: 1.18 } },
  ],
  AMZN: [
    { name: 'AMZN', metrics: { 'P/E': 44.5, 'Mkt Cap ($B)': 2100, 'Rev ($B)': 638, Beta: 1.15 } },
    { name: 'WMT', metrics: { 'P/E': 28.6, 'Mkt Cap ($B)': 680, 'Rev ($B)': 648, Beta: 0.52 } },
    { name: 'SHOP', metrics: { 'P/E': 85.0, 'Mkt Cap ($B)': 110, 'Rev ($B)': 8, Beta: 2.4 } },
  ],
  TSLA: [
    { name: 'TSLA', metrics: { 'P/E': 112.4, 'Mkt Cap ($B)': 1200, 'Rev ($B)': 97, Beta: 2.31 } },
    { name: 'F', metrics: { 'P/E': 6.8, 'Mkt Cap ($B)': 48, 'Rev ($B)': 176, Beta: 1.45 } },
    { name: 'RIVN', metrics: { 'P/E': 'N/A', 'Mkt Cap ($B)': 12, 'Rev ($B)': 5, Beta: 2.1 } },
  ],
  META: [
    { name: 'META', metrics: { 'P/E': 26.4, 'Mkt Cap ($B)': 1400, 'Rev ($B)': 165, Beta: 1.22 } },
    { name: 'GOOGL', metrics: { 'P/E': 24.8, 'Mkt Cap ($B)': 2000, 'Rev ($B)': 350, Beta: 1.05 } },
    { name: 'SNAP', metrics: { 'P/E': 'N/A', 'Mkt Cap ($B)': 22, 'Rev ($B)': 5, Beta: 1.6 } },
  ],
  GOOGL: [
    { name: 'GOOGL', metrics: { 'P/E': 24.8, 'Mkt Cap ($B)': 2000, 'Rev ($B)': 350, Beta: 1.05 } },
    { name: 'META', metrics: { 'P/E': 26.4, 'Mkt Cap ($B)': 1400, 'Rev ($B)': 165, Beta: 1.22 } },
    { name: 'MSFT', metrics: { 'P/E': 35.8, 'Mkt Cap ($B)': 3100, 'Rev ($B)': 245, Beta: 0.89 } },
  ],
  JPM: [
    { name: 'JPM', metrics: { 'P/E': 12.1, 'Mkt Cap ($B)': 680, 'Rev ($B)': 162, Beta: 1.08 } },
    { name: 'BAC', metrics: { 'P/E': 11.4, 'Mkt Cap ($B)': 320, 'Rev ($B)': 98, Beta: 1.22 } },
    { name: 'GS', metrics: { 'P/E': 14.2, 'Mkt Cap ($B)': 160, 'Rev ($B)': 52, Beta: 1.35 } },
  ],
};

export function normalizeTicker(ticker: string) {
  return ticker.toUpperCase().trim();
}

export function getStockOption(ticker: string): StockOption | null {
  const normalized = normalizeTicker(ticker);
  return STOCK_OPTIONS.find((s) => s.ticker === normalized) ?? null;
}

export function getStocksBySector(sector: string): StockOption[] {
  return STOCK_OPTIONS.filter((s) => s.sector === sector);
}

export function getPriceHistory(ticker: string) {
  return PRICE_HISTORY[normalizeTicker(ticker)] ?? [];
}

export function getFundamentals(ticker: string): StockFundamentals | null {
  return FUNDAMENTALS[normalizeTicker(ticker)] ?? null;
}

export function getAnalysis(ticker: string): StockAnalysis | null {
  return ANALYSIS[normalizeTicker(ticker)] ?? null;
}

export function getPeers(ticker: string): StockPeer[] {
  return PEER_SETS[normalizeTicker(ticker)] ?? [];
}

export function hasStockProfile(ticker: string): boolean {
  return Boolean(PRICE_HISTORY[normalizeTicker(ticker)]);
}