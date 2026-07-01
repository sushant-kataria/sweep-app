import { NextResponse } from 'next/server';

import { getAllMetros, getSeedMeta } from '@/lib/real-estate-market/seed';

export const runtime = 'nodejs';

export async function GET() {
  const metros = getAllMetros().map((m) => ({
    slug: m.slug,
    name: m.name,
    stateCode: m.stateCode,
    zipCount: m.zipCount,
    medianSalePrice: m.medianSalePrice,
    medianRent: m.medianRent,
    medianYield: m.medianYield,
    medianDom: m.medianDom,
    priceYoy: m.priceYoy,
  }));

  return NextResponse.json({ ...getSeedMeta(), metros });
}
