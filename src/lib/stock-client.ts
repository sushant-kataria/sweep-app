import { buildStockSession } from './stock-session';
import type { StockSession } from './stock-types';

export async function loadStockSessionByTicker(ticker: string): Promise<StockSession> {
  const normalized = ticker.trim().toUpperCase();
  if (!normalized) {
    throw new Error('Ticker required.');
  }

  const preloaded = buildStockSession(normalized);
  if (preloaded) return preloaded;

  const res = await fetch(`/api/stock/${encodeURIComponent(normalized)}/session`);
  const data = (await res.json()) as StockSession & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `No equity profile for ${normalized}.`);
  }

  return data;
}
