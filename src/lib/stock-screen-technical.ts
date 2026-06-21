/** Technical indicators from daily close series (oldest → newest). */

export function computeSma(closes: number[], period: number): number | null {
  if (closes.length < period || period < 1) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function computeRsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function pctFromHigh(price: number, high: number | null): number | null {
  if (high == null || high <= 0 || !Number.isFinite(price)) return null;
  return ((high - price) / high) * 100;
}

export function pctFromLow(price: number, low: number | null): number | null {
  if (low == null || low <= 0 || !Number.isFinite(price)) return null;
  return ((price - low) / low) * 100;
}
