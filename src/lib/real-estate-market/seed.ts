import type { MetroSummary, RealEstateSeedData, ZipMarketRow } from './types';

import seedData from './seed-data.json';

let cached: RealEstateSeedData | null = null;

export function getSeedData(): RealEstateSeedData {
  if (!cached) {
    cached = seedData as RealEstateSeedData;
  }
  return cached;
}

export function getAllMetros(): MetroSummary[] {
  return getSeedData().metros;
}

export function getMetroBySlug(slug: string): MetroSummary | null {
  return getAllMetros().find((m) => m.slug === slug) ?? null;
}

export function getZipRow(zip: string): ZipMarketRow | null {
  const normalized = zip.replace(/\D/g, '').slice(0, 5);
  if (normalized.length !== 5) return null;

  for (const metro of getAllMetros()) {
    const row = metro.zips.find((z) => z.zip === normalized);
    if (row) return row;
  }
  return null;
}

export function getAllZipRows(): ZipMarketRow[] {
  return getAllMetros().flatMap((m) => m.zips);
}

export function getSeedMeta() {
  const data = getSeedData();
  return {
    generatedAt: data.generatedAt,
    source: data.source,
    zipCount: data.zipCount,
    metroCount: data.metroCount,
  };
}
