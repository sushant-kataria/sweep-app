import { fetchSecTickerList } from './companies-db';

let nameByTicker: Map<string, string> | null = null;
let nameMapLoadedAt = 0;
const NAME_MAP_TTL_MS = 24 * 60 * 60 * 1000;

async function ensureNameMap(): Promise<Map<string, string>> {
  if (nameByTicker && Date.now() - nameMapLoadedAt < NAME_MAP_TTL_MS) {
    return nameByTicker;
  }

  const companies = await fetchSecTickerList();
  nameByTicker = new Map(companies.map((c) => [c.ticker.toUpperCase(), c.name]));
  nameMapLoadedAt = Date.now();
  return nameByTicker;
}

export async function getCompanyNamesForTickers(tickers: string[]): Promise<Map<string, string>> {
  const map = await ensureNameMap();
  const out = new Map<string, string>();
  for (const ticker of tickers) {
    const key = ticker.toUpperCase();
    out.set(key, map.get(key) ?? key);
  }
  return out;
}
