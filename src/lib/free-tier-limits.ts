import type { ScreenResultsPayload } from '@/lib/screen-result-types';
import type { RealEstateScreenResults } from '@/lib/real-estate-market/types';
import { buildRealEstateSamplePreview, buildScreenSamplePreview } from '@/lib/free-tier-copy';
import { FREE_SAMPLE_ROWS } from '@/lib/free-tier';

export function applyFreeSampleLimit<T extends ScreenResultsPayload>(payload: T): T {
  const rows = payload.rows.slice(0, FREE_SAMPLE_ROWS);
  const samplePreview = buildScreenSamplePreview(payload.total, 'stocks');
  return {
    ...payload,
    rows,
    page: 1,
    limit: FREE_SAMPLE_ROWS,
    total: payload.total,
    totalPages: 1,
    scanNote: `Free sample — ${rows.length} of ${payload.total} stocks shown. Pro unlocks the full table, pagination, custom queries, and export.`,
    samplePreview,
    preview: true,
  } as T;
}

export function applyFreeRealEstateSampleLimit(payload: RealEstateScreenResults): RealEstateScreenResults {
  const rows = payload.rows.slice(0, FREE_SAMPLE_ROWS);
  const samplePreview = buildRealEstateSamplePreview(payload.total);
  return {
    ...payload,
    rows,
    page: 1,
    limit: FREE_SAMPLE_ROWS,
    total: payload.total,
    totalPages: 1,
    scanNote: `Free sample — ${rows.length} of ${payload.total} ZIPs shown. Pro unlocks the full screen, pagination, and CSV export.`,
    samplePreview,
    preview: true,
  };
}
