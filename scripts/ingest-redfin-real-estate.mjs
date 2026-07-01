/**
 * Stream Redfin public ZIP market tracker (free) and build seed JSON.
 * Run: node scripts/ingest-redfin-real-estate.mjs
 */
import { createWriteStream } from 'fs';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { createInterface } from 'readline';

const REDFIN_ZIP_URL =
  'https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/zip_code_market_tracker.tsv000.gz';

/** Redfin PARENT_METRO_REGION values to include (30 major metros). */
const METRO_PATTERNS = new Set([
  'Austin, TX',
  'Los Angeles, CA',
  'San Francisco, CA',
  'San Diego, CA',
  'San Jose, CA',
  'Miami, FL',
  'Tampa, FL',
  'Orlando, FL',
  'New York, NY',
  'Dallas, TX',
  'Houston, TX',
  'San Antonio, TX',
  'Phoenix, AZ',
  'Chicago, IL',
  'Atlanta, GA',
  'Denver, CO',
  'Seattle, WA',
  'Portland, OR',
  'Boston, MA',
  'Philadelphia, PA',
  'Washington, DC',
  'Nashville, TN',
  'Charlotte, NC',
  'Raleigh, NC',
  'Las Vegas, NV',
  'Minneapolis, MN',
  'Detroit, MI',
  'Columbus, OH',
  'Indianapolis, IN',
  'Jacksonville, FL',
]);

const MAX_ZIPS_PER_METRO = 80;

function unquote(v) {
  return String(v ?? '').replace(/^"|"$/g, '').trim();
}

function parseNum(v) {
  const s = unquote(v);
  if (!s || s === 'NA' || s === 'N/A') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function extractZip(region) {
  const m = unquote(region).match(/Zip Code:\s*(\d{5})/i);
  return m?.[1] ?? null;
}

function slugifyMetro(parent) {
  return unquote(parent)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function estimateMonthlyRent(price) {
  if (price == null || price <= 0) return null;
  return Math.round(price * 0.007);
}

function grossYield(price, rent) {
  if (price == null || price <= 0 || rent == null || rent <= 0) return null;
  return ((rent * 12) / price) * 100;
}

function dealScore(row, metroMedianYield) {
  let score = 40;
  const y = row.grossYield;
  if (y != null && metroMedianYield != null) {
    score += Math.min(15, Math.max(0, (y - metroMedianYield + 0.5) * 6));
  }
  if (row.priceYoy != null && row.priceYoy < 0) {
    score += Math.min(18, Math.abs(row.priceYoy) * 80);
  }
  if (row.priceYoy != null && row.priceYoy > 0.15) score -= 8;
  if (row.medianSalePrice != null && row.medianListPrice != null && row.medianListPrice > 0) {
    const discount = (row.medianListPrice - row.medianSalePrice) / row.medianListPrice;
    if (discount > 0) score += Math.min(12, discount * 40);
  }
  if (row.medianDom != null && row.medianDom < 25) score += 10;
  else if (row.medianDom != null && row.medianDom > 45) score += 5;
  if (row.inventoryYoy != null && row.inventoryYoy > 0.1) score += 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeDealScores(rows) {
  if (rows.length === 0) return rows;
  const raw = rows.map((r) => r.dealScore);
  const min = Math.min(...raw);
  const max = Math.max(...raw);
  if (max === min) return rows;
  return rows.map((r) => ({
    ...r,
    dealScore: Math.round(((r.dealScore - min) / (max - min)) * 100),
  }));
}

async function main() {
  console.log('Fetching Redfin ZIP data…');
  const res = await fetch(REDFIN_ZIP_URL);
  if (!res.ok) throw new Error(`Redfin download failed (${res.status})`);

  const byZip = new Map();
  let lines = 0;

  const body = Readable.fromWeb(res.body);
  const gunzip = createGunzip();
  const rl = createInterface({ input: body.pipe(gunzip), crlfDelay: true });

  for await (const line of rl) {
    lines += 1;
    if (lines === 1) continue;
    const cols = line.split('\t');
    if (cols.length < 57) continue;
    if (unquote(cols[11]) !== 'All Residential') continue;

    const parentMetro = unquote(cols[55]);
    if (!METRO_PATTERNS.has(parentMetro)) continue;

    const zip = extractZip(cols[7]);
    if (!zip) continue;

    const periodEnd = unquote(cols[1]);
    const existing = byZip.get(zip);
    if (existing && existing.periodEnd >= periodEnd) continue;

    const medianSalePrice = parseNum(cols[13]);
    const estRent = estimateMonthlyRent(medianSalePrice);

    byZip.set(zip, {
      zip,
      state: unquote(cols[10]),
      stateCode: unquote(cols[9]),
      metro: parentMetro,
      metroSlug: slugifyMetro(parentMetro),
      metroCode: unquote(cols[56]),
      medianSalePrice,
      medianListPrice: parseNum(cols[16]),
      medianDom: parseNum(cols[40]),
      homesSold: parseNum(cols[25]),
      inventory: parseNum(cols[34]),
      priceYoy: parseNum(cols[15]),
      inventoryYoy: parseNum(cols[36]),
      periodEnd,
      estMonthlyRent: estRent,
      grossYield: grossYield(medianSalePrice, estRent),
      dataSource: 'redfin',
    });

    if (lines % 500000 === 0) console.log(`  …${lines.toLocaleString()} lines, ${byZip.size} zips`);
  }

  const zips = [...byZip.values()].filter((z) => z.medianSalePrice != null);

  const metroCounts = new Map();
  const capped = zips
    .sort((a, b) => (b.medianSalePrice ?? 0) - (a.medianSalePrice ?? 0))
    .filter((z) => {
      const n = metroCounts.get(z.metroSlug) ?? 0;
      if (n >= MAX_ZIPS_PER_METRO) return false;
      metroCounts.set(z.metroSlug, n + 1);
      return true;
    });

  const metros = new Map();
  for (const z of capped) {
    const list = metros.get(z.metroSlug) ?? [];
    list.push(z);
    metros.set(z.metroSlug, list);
  }

  const metroSummaries = [...metros.entries()].map(([slug, rows]) => {
    const prices = rows.map((r) => r.medianSalePrice).filter((v) => v != null);
    const rents = rows.map((r) => r.estMonthlyRent).filter((v) => v != null);
    const yields = rows.map((r) => r.grossYield).filter((v) => v != null);
    const doms = rows.map((r) => r.medianDom).filter((v) => v != null);
    const yoys = rows.map((r) => r.priceYoy).filter((v) => v != null);
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    const medianYield = avg(yields);

    const zipRows = rows.map((r) => ({
      ...r,
      dealScore: dealScore(r, medianYield),
    }));

    return {
      slug,
      name: rows[0].metro,
      stateCode: rows[0].stateCode,
      zipCount: zipRows.length,
      medianSalePrice: avg(prices),
      medianRent: avg(rents),
      medianYield,
      medianDom: avg(doms),
      priceYoy: avg(yoys),
      zips: zipRows,
    };
  });

  const allZipRows = metroSummaries.flatMap((m) => m.zips);
  const normalized = normalizeDealScores(allZipRows);
  const normalizedByZip = new Map(normalized.map((z) => [z.zip, z]));

  for (const metro of metroSummaries) {
    metro.zips = metro.zips
      .map((z) => normalizedByZip.get(z.zip) ?? z)
      .sort((a, b) => (b.dealScore ?? 0) - (a.dealScore ?? 0));
  }

  metroSummaries.sort((a, b) => a.name.localeCompare(b.name));

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'https://www.redfin.com/news/data-center/',
    zipCount: capped.length,
    metroCount: metroSummaries.length,
    metros: metroSummaries,
  };

  const outPath = new URL('../src/lib/real-estate-market/seed-data.json', import.meta.url);
  await import('fs/promises').then((fs) => fs.writeFile(outPath, JSON.stringify(payload, null, 2)));
  console.log(`Done: ${metroSummaries.length} metros, ${capped.length} zips → ${outPath.pathname}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
