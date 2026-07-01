import { getAllMetros, getAllZipRows } from './seed';
import { getRealEstateScreenById } from './screens';
import type {
  RealEstateScreenColumn,
  RealEstateScreenResultRow,
  RealEstateScreenResults,
  ZipMarketRow,
} from './types';

const DEFAULT_COLUMNS: RealEstateScreenColumn[] = [
  { id: 'zip', label: 'ZIP', align: 'left' },
  { id: 'metro', label: 'Metro', align: 'left' },
  { id: 'price', label: 'Median price', align: 'right' },
  { id: 'rent', label: 'Est. rent/mo', align: 'right' },
  { id: 'yield', label: 'Gross yield', align: 'right' },
  { id: 'dom', label: 'DOM', align: 'right' },
  { id: 'yoy', label: 'Price YoY', align: 'right' },
  { id: 'score', label: 'Deal score', align: 'right' },
  { id: 'signal', label: 'Signal', align: 'left' },
];

function toResultRow(row: ZipMarketRow): RealEstateScreenResultRow {
  let signal: string | null = null;
  if (row.dealScore >= 75) signal = 'Strong';
  else if (row.dealScore >= 60) signal = 'Watch';
  else if (row.priceYoy != null && row.priceYoy < 0) signal = 'Dip';

  return {
    zip: row.zip,
    metro: row.metro,
    metroSlug: row.metroSlug,
    stateCode: row.stateCode,
    medianSalePrice: row.medianSalePrice,
    estMonthlyRent: row.estMonthlyRent,
    grossYield: row.grossYield,
    medianDom: row.medianDom,
    priceYoy: row.priceYoy,
    dealScore: row.dealScore,
    signal,
  };
}

function metroMedianYield(metroSlug: string): number | null {
  const metro = getAllMetros().find((m) => m.slug === metroSlug);
  return metro?.medianYield ?? null;
}

function filterByScreen(id: string, rows: ZipMarketRow[]): ZipMarketRow[] {
  switch (id) {
    case 'high-yield':
      return rows.filter((r) => {
        const med = metroMedianYield(r.metroSlug);
        return r.grossYield != null && med != null && r.grossYield > med;
      });
    case 'price-dip':
      return rows.filter((r) => r.priceYoy != null && r.priceYoy < 0);
    case 'fast-movers':
      return rows.filter((r) => r.medianDom != null && r.medianDom < 30);
    case 'rising-inventory':
      return rows.filter((r) => r.inventoryYoy != null && r.inventoryYoy > 0.1);
    case 'top-deals': {
      const top = rows.filter((r) => r.dealScore >= 60);
      if (top.length > 0) return top;
      return [...rows].sort((a, b) => b.dealScore - a.dealScore);
    }
    case 'affordable-entry':
      return rows.filter((r) => r.medianSalePrice != null && r.medianSalePrice < 400_000);
    default:
      return [];
  }
}

function sortRows(id: string, rows: ZipMarketRow[]): ZipMarketRow[] {
  const copy = [...rows];
  switch (id) {
    case 'high-yield':
      return copy.sort((a, b) => (b.grossYield ?? 0) - (a.grossYield ?? 0));
    case 'price-dip':
      return copy.sort((a, b) => (a.priceYoy ?? 0) - (b.priceYoy ?? 0));
    case 'fast-movers':
      return copy.sort((a, b) => (a.medianDom ?? 999) - (b.medianDom ?? 999));
    case 'rising-inventory':
      return copy.sort((a, b) => (b.inventoryYoy ?? 0) - (a.inventoryYoy ?? 0));
    case 'top-deals':
      return copy.sort((a, b) => b.dealScore - a.dealScore);
    case 'affordable-entry':
      return copy.sort((a, b) => (a.medianSalePrice ?? 0) - (b.medianSalePrice ?? 0));
    default:
      return copy;
  }
}

export async function runRealEstateScreen(
  id: string,
  opts: { page?: number; limit?: number } = {},
): Promise<RealEstateScreenResults> {
  const screen = getRealEstateScreenById(id);
  if (!screen) throw new Error('Screen not found.');

  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 25));

  const filtered = sortRows(id, filterByScreen(id, getAllZipRows()));
  const total = filtered.length;
  const start = (page - 1) * limit;
  const pageRows = filtered.slice(start, start + limit).map(toResultRow);

  const scanNote =
    total === 0
      ? 'No ZIPs matched this screen in the current Redfin seed.'
      : `Showing ${pageRows.length} of ${total} ZIPs · Rent estimated via 0.7% rule · Data: Redfin market tracker`;

  return {
    screenId: id,
    title: screen.title,
    description: screen.description,
    formula: screen.formula,
    columns: DEFAULT_COLUMNS,
    rows: pageRows,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    scanNote,
  };
}
