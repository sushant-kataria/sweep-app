import { NextResponse } from 'next/server';

import { getCompanyCount } from '@/lib/companies-db';
import { isTursoConfigured } from '@/lib/turso';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const tursoConfigured = isTursoConfigured();
    const companyCount = tursoConfigured ? await getCompanyCount() : 0;

    return NextResponse.json({
      tursoConfigured,
      companyCount,
      searchMode: tursoConfigured && companyCount > 0 ? 'turso' : 'sec-fallback',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Status check failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
