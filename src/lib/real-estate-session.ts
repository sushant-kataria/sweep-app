import {
  DEMO_PORTFOLIO,
  computeMarketMetrics,
  computePortfolioMetrics,
  getListings,
  getMarket,
  getMarketAnalysis,
  getPortfolioAnalysis,
} from './real-estate-data';
import type { RealEstateSession } from './real-estate-types';

export function buildMarketSession(marketId: string): RealEstateSession | null {
  const market = getMarket(marketId);
  if (!market) return null;

  const listings = getListings(marketId);
  const analysis = getMarketAnalysis(marketId);
  if (!analysis) return null;

  return {
    mode: 'market',
    market,
    listings,
    metrics: computeMarketMetrics(market, listings),
    analysis,
    loadedAt: Date.now(),
  };
}

export function buildPortfolioSession(): RealEstateSession {
  const market = getMarket('la')!;
  const portfolio = DEMO_PORTFOLIO;

  return {
    mode: 'portfolio',
    market,
    portfolio,
    metrics: computePortfolioMetrics(portfolio),
    analysis: getPortfolioAnalysis(),
    loadedAt: Date.now(),
  };
}