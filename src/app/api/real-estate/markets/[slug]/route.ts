import { NextResponse } from 'next/server';

import { getMetroBySlug } from '@/lib/real-estate-market/seed';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const metro = getMetroBySlug(slug);
  if (!metro) {
    return NextResponse.json({ error: 'Metro not found.' }, { status: 404 });
  }

  return NextResponse.json({
    slug: metro.slug,
    name: metro.name,
    stateCode: metro.stateCode,
    zipCount: metro.zipCount,
    medianSalePrice: metro.medianSalePrice,
    medianRent: metro.medianRent,
    medianYield: metro.medianYield,
    medianDom: metro.medianDom,
    priceYoy: metro.priceYoy,
    zips: metro.zips.map((z) => ({
      zip: z.zip,
      city: z.city,
      medianSalePrice: z.medianSalePrice,
      estMonthlyRent: z.estMonthlyRent,
      grossYield: z.grossYield,
      medianDom: z.medianDom,
      priceYoy: z.priceYoy,
      dealScore: z.dealScore,
    })),
  });
}
