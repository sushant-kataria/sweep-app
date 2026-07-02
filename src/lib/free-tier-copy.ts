import { FREE_SAMPLE_ROWS } from '@/lib/free-tier';

export type FreeSamplePreview = {
  shown: number;
  total: number;
  unit: string;
  proUnlocks: string[];
};

export function buildScreenSamplePreview(total: number, unit = 'results'): FreeSamplePreview {
  const shown = Math.min(FREE_SAMPLE_ROWS, total);
  return {
    shown,
    total,
    unit,
    proUnlocks: ['Full result table', 'Pagination & custom queries', 'CSV export'],
  };
}

export function buildRealEstateSamplePreview(total: number): FreeSamplePreview {
  const shown = Math.min(FREE_SAMPLE_ROWS, total);
  return {
    shown,
    total,
    unit: 'ZIPs',
    proUnlocks: ['All matching ZIPs', 'Pagination', 'CSV export'],
  };
}

export function formatSampleHeadline(preview: FreeSamplePreview): string {
  const hidden = Math.max(0, preview.total - preview.shown);
  if (hidden <= 0) {
    return `Free sample — showing ${preview.shown} ${preview.unit}`;
  }
  return `Free sample — ${preview.shown} of ${preview.total.toLocaleString()} ${preview.unit} shown`;
}

export function formatSamplePurpose(preview: FreeSamplePreview): string {
  const hidden = Math.max(0, preview.total - preview.shown);
  if (hidden <= 0) {
    return 'These rows are real market data you can explore on the free tier. Upgrade to Pro when you need the full workspace.';
  }
  return `You're seeing a taste of real data — ${hidden.toLocaleString()} more ${preview.unit} are hidden on the free tier. Upgrade to Pro to run the full screen on your deals and exports.`;
}
