import type { StockSession } from './stock-types';

const KEY = 'sweep_stock_session';

export function saveStockSession(session: StockSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function loadStockSession(): StockSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StockSession;
  } catch {
    return null;
  }
}

export function clearStockSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}