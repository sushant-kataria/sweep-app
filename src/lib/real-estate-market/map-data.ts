import { getAllMetros, getAllZipRows } from './seed';
import zipCoords from './zip-coords.json';
import type { MetroSummary, ZipMarketRow } from './types';

export type MapZipPoint = ZipMarketRow & {
  lat: number;
  lng: number;
};

export type MapMetroLite = {
  slug: string;
  name: string;
  stateCode: string;
  zipCount: number;
  medianSalePrice: number | null;
  medianYield: number | null;
  dealScoreTop: number | null;
  lat: number;
  lng: number;
};

export type MapMetroPoint = MapMetroLite & {
  zips: MapZipPoint[];
};

export type MapCityEntry = {
  key: string;
  label: string;
  kind: 'metro' | 'city';
  metroSlug: string;
  lat: number;
  lng: number;
  zipCount: number;
};

const coordsByZip = zipCoords as Record<string, [number, number]>;

export function getZipCoords(zip: string): [number, number] | null {
  return coordsByZip[zip] ?? null;
}

export function enrichZipWithCoords(row: ZipMarketRow): MapZipPoint | null {
  const c = getZipCoords(row.zip);
  if (!c) return null;
  return { ...row, lat: c[0], lng: c[1] };
}

export function buildMapMetrosLite(): MapMetroLite[] {
  return getAllMetros()
    .map((metro) => {
      const zips = metro.zips
        .map(enrichZipWithCoords)
        .filter((z): z is MapZipPoint => z != null);

      if (zips.length === 0) return null;

      const lat = zips.reduce((s, z) => s + z.lat, 0) / zips.length;
      const lng = zips.reduce((s, z) => s + z.lng, 0) / zips.length;
      const dealScoreTop = zips.reduce((max, z) => Math.max(max, z.dealScore ?? 0), 0);

      return {
        slug: metro.slug,
        name: metro.name,
        stateCode: metro.stateCode,
        zipCount: zips.length,
        medianSalePrice: metro.medianSalePrice,
        medianYield: metro.medianYield,
        dealScoreTop: dealScoreTop || null,
        lat,
        lng,
      };
    })
    .filter((m): m is MapMetroLite => m != null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Compact city/metro search index — built on server, no full ZIP payloads. */
export function buildCitySearchIndexFromSeed(): MapCityEntry[] {
  const entries: MapCityEntry[] = [];
  const seen = new Set<string>();

  for (const metro of getAllMetros()) {
    const zips = metro.zips
      .map(enrichZipWithCoords)
      .filter((z): z is MapZipPoint => z != null);
    if (zips.length === 0) continue;

    const lat = zips.reduce((s, z) => s + z.lat, 0) / zips.length;
    const lng = zips.reduce((s, z) => s + z.lng, 0) / zips.length;

    const metroKey = `metro:${metro.slug}`;
    if (!seen.has(metroKey)) {
      seen.add(metroKey);
      entries.push({
        key: metroKey,
        label: metro.name,
        kind: 'metro',
        metroSlug: metro.slug,
        lat,
        lng,
        zipCount: zips.length,
      });
    }

    const cityGroups = new Map<string, MapZipPoint[]>();
    for (const z of zips) {
      if (!z.city) continue;
      const cityKey = `${z.city}|${z.stateCode}`;
      const list = cityGroups.get(cityKey) ?? [];
      list.push(z);
      cityGroups.set(cityKey, list);
    }

    for (const [cityKey, cityZips] of cityGroups) {
      const [city] = cityKey.split('|');
      const key = `city:${metro.slug}:${cityKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({
        key,
        label: `${city}, ${cityZips[0].stateCode}`,
        kind: 'city',
        metroSlug: metro.slug,
        lat: cityZips.reduce((s, z) => s + z.lat, 0) / cityZips.length,
        lng: cityZips.reduce((s, z) => s + z.lng, 0) / cityZips.length,
        zipCount: cityZips.length,
      });
    }
  }

  return entries.sort((a, b) => a.label.localeCompare(b.label));
}

export function buildMapMetros(): MapMetroPoint[] {
  return getAllMetros()
    .map((metro) => {
      const zips = metro.zips
        .map(enrichZipWithCoords)
        .filter((z): z is MapZipPoint => z != null);

      if (zips.length === 0) return null;

      const lat = zips.reduce((s, z) => s + z.lat, 0) / zips.length;
      const lng = zips.reduce((s, z) => s + z.lng, 0) / zips.length;
      const dealScoreTop = zips.reduce((max, z) => Math.max(max, z.dealScore ?? 0), 0);

      return {
        slug: metro.slug,
        name: metro.name,
        stateCode: metro.stateCode,
        zipCount: zips.length,
        medianSalePrice: metro.medianSalePrice,
        medianYield: metro.medianYield,
        dealScoreTop: dealScoreTop || null,
        lat,
        lng,
        zips,
      };
    })
    .filter((m): m is MapMetroPoint => m != null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildCitySearchIndex(metros: MapMetroPoint[]): MapCityEntry[] {
  const entries: MapCityEntry[] = [];
  const seen = new Set<string>();

  for (const metro of metros) {
    const metroKey = `metro:${metro.slug}`;
    if (!seen.has(metroKey)) {
      seen.add(metroKey);
      entries.push({
        key: metroKey,
        label: metro.name,
        kind: 'metro',
        metroSlug: metro.slug,
        lat: metro.lat,
        lng: metro.lng,
        zipCount: metro.zipCount,
      });
    }

    const cityGroups = new Map<string, MapZipPoint[]>();
    for (const z of metro.zips) {
      if (!z.city) continue;
      const cityKey = `${z.city}|${z.stateCode}`;
      const list = cityGroups.get(cityKey) ?? [];
      list.push(z);
      cityGroups.set(cityKey, list);
    }

    for (const [cityKey, zips] of cityGroups) {
      const [city] = cityKey.split('|');
      const key = `city:${metro.slug}:${cityKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({
        key,
        label: `${city}, ${zips[0].stateCode}`,
        kind: 'city',
        metroSlug: metro.slug,
        lat: zips.reduce((s, z) => s + z.lat, 0) / zips.length,
        lng: zips.reduce((s, z) => s + z.lng, 0) / zips.length,
        zipCount: zips.length,
      });
    }
  }

  return entries.sort((a, b) => a.label.localeCompare(b.label));
}

export function searchMapLocations(query: string, index: MapCityEntry[], limit = 12): MapCityEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index
    .filter((e) => e.label.toLowerCase().includes(q))
    .slice(0, limit);
}

export function dealScoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 55) return '#eab308';
  if (score >= 35) return '#f97316';
  return '#ef4444';
}

export function getMapBounds(metros: Array<{ lat: number; lng: number; zips?: MapZipPoint[] }>): [[number, number], [number, number]] {
  const all = metros.flatMap((m) => (m.zips && m.zips.length > 0 ? m.zips : [{ lat: m.lat, lng: m.lng }]));
  if (all.length === 0) return [[24, -125], [50, -66]];
  const lats = all.map((z) => z.lat);
  const lngs = all.map((z) => z.lng);
  const pad = 0.4;
  return [
    [Math.min(...lats) - pad, Math.min(...lngs) - pad],
    [Math.max(...lats) + pad, Math.max(...lngs) + pad],
  ];
}

export function getMetroBySlugFromMap<T extends { slug: string }>(metros: T[], slug: string): T | null {
  return metros.find((m) => m.slug === slug) ?? null;
}

export function getZipsForCity(metro: MapMetroPoint, cityLabel: string): MapZipPoint[] {
  const city = cityLabel.split(',')[0]?.trim().toLowerCase();
  if (!city) return metro.zips;
  return metro.zips.filter((z) => z.city?.toLowerCase() === city);
}

/** Map API metro ZIP rows (no coords) to renderable points using bundled zip-coords. */
export function enrichApiZipsForMap(
  zips: Array<{
    zip: string;
    city: string | null;
    medianSalePrice: number | null;
    estMonthlyRent: number | null;
    grossYield: number | null;
    medianDom: number | null;
    priceYoy: number | null;
    dealScore: number;
  }>,
  metro: Pick<MapMetroLite, 'slug' | 'name' | 'stateCode'>,
): MapZipPoint[] {
  return zips
    .map((z) =>
      enrichZipWithCoords({
        zip: z.zip,
        city: z.city,
        state: metro.stateCode,
        stateCode: metro.stateCode,
        metro: metro.name,
        metroSlug: metro.slug,
        metroCode: '',
        medianSalePrice: z.medianSalePrice,
        medianListPrice: null,
        medianDom: z.medianDom,
        homesSold: null,
        inventory: null,
        priceYoy: z.priceYoy,
        inventoryYoy: null,
        periodEnd: '',
        estMonthlyRent: z.estMonthlyRent,
        grossYield: z.grossYield,
        dataSource: '',
        dealScore: z.dealScore,
      }),
    )
    .filter((z): z is MapZipPoint => z != null);
}

export { getAllZipRows };
