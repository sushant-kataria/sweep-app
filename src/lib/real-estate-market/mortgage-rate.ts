const FRED_CSV_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US';
const DEFAULT_RATE = 6.75;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let cachedRate: { value: number; fetchedAt: number } | null = null;

function parseFredCsv(text: string): number | null {
  const lines = text.trim().split('\n');
  for (let i = lines.length - 1; i >= 1; i -= 1) {
    const parts = lines[i].split(',');
    const value = Number(parts[1]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

export async function getMortgageRate(): Promise<{ rate: number; source: string }> {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < CACHE_TTL_MS) {
    return { rate: cachedRate.value, source: 'FRED MORTGAGE30US (cached)' };
  }

  try {
    const res = await fetch(FRED_CSV_URL, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`FRED ${res.status}`);
    const text = await res.text();
    const rate = parseFredCsv(text);
    if (rate == null) throw new Error('No rate in CSV');
    cachedRate = { value: rate, fetchedAt: Date.now() };
    return { rate, source: 'FRED MORTGAGE30US' };
  } catch {
    return { rate: DEFAULT_RATE, source: 'Default estimate (FRED unavailable)' };
  }
}
