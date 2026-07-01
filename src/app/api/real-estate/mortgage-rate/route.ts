import { NextResponse } from 'next/server';

import { getMortgageRate } from '@/lib/real-estate-market/mortgage-rate';

export const runtime = 'nodejs';

export async function GET() {
  const { rate, source } = await getMortgageRate();
  return NextResponse.json({ rate, source });
}
