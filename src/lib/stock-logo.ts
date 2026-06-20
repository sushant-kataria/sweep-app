/** Free public logo CDN — no API key required. */
const FMP_LOGO_BASE = 'https://financialmodelingprep.com/image-stock';
const PARQET_LOGO_BASE = 'https://assets.parqet.com/logos/symbol';

export function normalizeLogoTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

export function getStockLogoUrl(ticker: string, source: 'fmp' | 'parqet' = 'fmp'): string {
  const normalized = normalizeLogoTicker(ticker);
  if (source === 'parqet') {
    return `${PARQET_LOGO_BASE}/${encodeURIComponent(normalized.replace('.', '-'))}`;
  }
  return `${FMP_LOGO_BASE}/${encodeURIComponent(normalized)}.png`;
}

export function getStockLogoFallbackSources(ticker: string): Array<'fmp' | 'parqet'> {
  return ['fmp', 'parqet'];
}

export function tickerInitials(ticker: string): string {
  const normalized = normalizeLogoTicker(ticker);
  return normalized.slice(0, Math.min(2, normalized.length));
}
