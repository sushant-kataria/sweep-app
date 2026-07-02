/**
 * Build compact ZIP → lat/lng lookup for map markers from GeoNames + seed data.
 * Run: node scripts/generate-zip-coords.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const GEONAMES_CACHE = join(process.cwd(), 'scripts/cache/geonames-us.txt');
const SEED_PATH = join(process.cwd(), 'src/lib/real-estate-market/seed-data.json');
const OUT_PATH = join(process.cwd(), 'src/lib/real-estate-market/zip-coords.json');

function loadGeoNamesCoords() {
  if (!existsSync(GEONAMES_CACHE)) {
    throw new Error('Missing scripts/cache/geonames-us.txt — run seed:real-estate first or download GeoNames US.zip');
  }
  const text = readFileSync(GEONAMES_CACHE, 'utf8');
  const map = new Map();
  for (const line of text.split('\n')) {
    if (!line.startsWith('US\t')) continue;
    const cols = line.split('\t');
    const zip = cols[1];
    const lat = Number(cols[9]);
    const lng = Number(cols[10]);
    const accuracy = Number(cols[11] ?? 9);
    if (!zip || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const existing = map.get(zip);
    if (!existing || accuracy < existing.accuracy) {
      map.set(zip, { lat, lng, accuracy });
    }
  }
  return map;
}

function main() {
  const seed = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
  const geonames = loadGeoNamesCoords();
  const coords = {};
  let matched = 0;
  let missing = 0;

  for (const metro of seed.metros) {
    for (const z of metro.zips) {
      const g = geonames.get(z.zip);
      if (g) {
        coords[z.zip] = [g.lat, g.lng];
        matched += 1;
      } else {
        missing += 1;
      }
    }
  }

  writeFileSync(OUT_PATH, JSON.stringify(coords));
  console.log(`Wrote ${matched} ZIP coords (${missing} missing) → ${OUT_PATH}`);
}

main();
