import type { ScreenResultsPayload } from '@/lib/screen-result-types';
import type { RealEstateScreenResults } from '@/lib/real-estate-market/types';
import { FREE_SAMPLE_ROWS } from '@/lib/free-tier';

export function applyFreeSampleLimit<T extends ScreenResultsPayload>(payload: T): T {
  const rows = payload.rows.slice(0, FREE_SAMPLE_ROWS);
  return {
    ...payload,
    rows,
    page: 1,
    limit: FREE_SAMPLE_ROWS,
    total: payload.total,
    totalPages: 1,
    scanNote: `Free preview — showing ${rows.length} of ${payload.total} results. Upgrade to Pro for full tables, pagination, and export.`,
    preview: true,
  } as T;
}

export function applyFreeRealEstateSampleLimit(payload: RealEstateScreenResults): RealEstateScreenResults {
  const rows = payload.rows.slice(0, FREE_SAMPLE_ROWS);
  return {
    ...payload,
    rows,
    page: 1,
    limit: FREE_SAMPLE_ROWS,
    total: payload.total,
    totalPages: 1,
    scanNote: `Free preview — showing ${rows.length} of ${payload.total} ZIPs. Upgrade to Pro for full screens, pagination, and CSV export.`,
    preview: true,
  };
}
