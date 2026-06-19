import {
  getAnalysis,
  getFundamentals,
  getPeers,
  getPriceHistory,
  getStockOption,
  hasStockProfile,
  normalizeTicker,
} from './stock-data';
import type { StockSession } from './stock-types';

export function buildStockSession(ticker: string): StockSession | null {
  const normalized = normalizeTicker(ticker);
  if (!hasStockProfile(normalized)) return null;

  const option = getStockOption(normalized);
  const priceHistory = getPriceHistory(normalized);
  const fundamentals = getFundamentals(normalized);
  const analysis = getAnalysis(normalized);
  const peers = getPeers(normalized);

  if (!fundamentals || !analysis || priceHistory.length === 0) return null;

  const lastPrice = priceHistory[priceHistory.length - 1].value;

  return {
    ticker: normalized,
    companyName: option?.name ?? normalized,
    sector: option?.sector ?? 'Unknown',
    lastPrice,
    currency: 'USD',
    priceHistory,
    fundamentals,
    peers,
    analysis,
    loadedAt: Date.now(),
  };
}