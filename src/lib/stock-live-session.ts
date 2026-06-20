import type { SecCompany } from './company-types';
import type { MarketSnapshot } from './market-types';
import type { StockAnalysis, StockFundamentals, StockPeer, StockSession } from './stock-types';

function formatUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatMarketCap(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${value.toLocaleString('en-US')}`;
}

export function buildLiveStockFundamentals(snapshot: MarketSnapshot): StockFundamentals {
  return {
    marketCap: formatMarketCap(snapshot.marketCap),
    peRatio: snapshot.peRatio,
    forwardPe: null,
    revenue: '—',
    eps: 0,
    dividendYield: null,
    beta: 0,
    fiftyTwoWeekHigh: snapshot.fiftyTwoWeekHigh ?? snapshot.price,
    fiftyTwoWeekLow: snapshot.fiftyTwoWeekLow ?? snapshot.price,
    avgVolume: '—',
  };
}

export function buildLiveStockAnalysis(company: SecCompany, snapshot: MarketSnapshot): StockAnalysis {
  const momentum =
    snapshot.changePct >= 2
      ? 'Strong near-term upside momentum.'
      : snapshot.changePct <= -2
        ? 'Near-term selling pressure versus prior close.'
        : 'Price action is relatively stable versus prior close.';

  return {
    executiveSummary: `${company.name} (${company.ticker}) is an SEC-registered filer (CIK ${company.cik}). This view combines live market data with a template research note — use the finance workspace for full balance-sheet analysis from EDGAR.`,
    keyHighlights: [
      `Last price ${formatUsd(snapshot.price)} (${formatPct(snapshot.changePct)} vs prior close).`,
      `52-week range ${formatUsd(snapshot.fiftyTwoWeekLow)} – ${formatUsd(snapshot.fiftyTwoWeekHigh)}.`,
      snapshot.peRatio != null ? `Trailing P/E ${snapshot.peRatio.toFixed(1)}x.` : 'Trailing P/E unavailable from current market feed.',
    ],
    valuationAssessment:
      snapshot.peRatio != null
        ? `Trades at ${snapshot.peRatio.toFixed(1)}x trailing earnings — compare to sector peers before drawing conclusions.`
        : 'Valuation multiples are limited in this live view; verify against latest filings.',
    momentumAssessment: momentum,
    strengths: ['SEC reporting transparency', 'Liquid US-listed equity', 'Live price and chart data'],
    riskFactors: [
      'Market and macro volatility',
      'Company-specific execution risk',
      'Figures here are not a substitute for audited financial statements',
    ],
    watchItems: ['Next earnings release', 'SEC filing updates', 'Sector peer relative performance'],
  };
}

export function buildLiveStockPeers(company: SecCompany, snapshot: MarketSnapshot): StockPeer[] {
  return [
    {
      name: company.ticker,
      metrics: {
        'Last price': snapshot.price,
        'P/E': snapshot.peRatio ?? '—',
        '52W high': snapshot.fiftyTwoWeekHigh ?? '—',
        '52W low': snapshot.fiftyTwoWeekLow ?? '—',
      },
    },
  ];
}

export function buildLiveStockSession(company: SecCompany, snapshot: MarketSnapshot): StockSession {
  const priceHistory = snapshot.history.length > 0 ? snapshot.history : [{ label: 'Now', value: snapshot.price }];

  return {
    ticker: company.ticker.toUpperCase(),
    companyName: company.name,
    sector: 'SEC filer',
    lastPrice: snapshot.price,
    currency: snapshot.currency,
    priceHistory,
    fundamentals: buildLiveStockFundamentals(snapshot),
    peers: buildLiveStockPeers(company, snapshot),
    analysis: buildLiveStockAnalysis(company, snapshot),
    loadedAt: Date.now(),
    liveData: true,
  };
}
