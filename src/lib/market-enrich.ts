import type { MarketSnapshot } from './market-types';

/** Fill market cap and P/E from EDGAR shares/EPS when Yahoo quote API is unavailable. */
export function enrichMarketSnapshot(
  snapshot: MarketSnapshot,
  edgar: { sharesOutstanding?: number | null; epsDiluted?: number | null },
): MarketSnapshot {
  let marketCap = snapshot.marketCap;
  let peRatio = snapshot.peRatio;

  if (marketCap == null && snapshot.price > 0 && edgar.sharesOutstanding != null && edgar.sharesOutstanding > 0) {
    marketCap = snapshot.price * edgar.sharesOutstanding;
  }

  if (peRatio == null && snapshot.price > 0 && edgar.epsDiluted != null && edgar.epsDiluted > 0) {
    peRatio = snapshot.price / edgar.epsDiluted;
  }

  return { ...snapshot, marketCap, peRatio };
}

export function formatVolume(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString('en-US');
}
