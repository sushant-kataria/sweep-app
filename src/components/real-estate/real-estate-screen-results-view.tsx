'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { PreviewBanner } from '@/components/auth/pro-gate';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';
import { formatDom, formatPct, formatUsd, formatYield } from '@/lib/real-estate-market/format';
import type { RealEstateScreenResults } from '@/lib/real-estate-market/types';

type Props = {
  screenId: string;
  backHref?: string;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function cellValue(row: RealEstateScreenResults['rows'][number], colId: string): string {
  switch (colId) {
    case 'zip':
      return row.zip;
    case 'city':
      return row.city ?? '—';
    case 'metro':
      return row.metro;
    case 'price':
      return formatUsd(row.medianSalePrice, true);
    case 'rent':
      return formatUsd(row.estMonthlyRent);
    case 'yield':
      return formatYield(row.grossYield);
    case 'dom':
      return formatDom(row.medianDom);
    case 'yoy':
      return formatPct(row.priceYoy != null ? row.priceYoy * 100 : null);
    case 'score':
      return row.dealScore != null ? String(row.dealScore) : '—';
    case 'signal':
      return row.signal ?? '—';
    default:
      return '—';
  }
}

export function RealEstateScreenResultsView({ screenId, backHref = '/real-estate' }: Props) {
  const { theme, toggleTheme } = useSweepTheme();
  const [payload, setPayload] = useState<RealEstateScreenResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/real-estate/screens/${screenId}?page=${page}&limit=${limit}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load screen.');
      setPayload(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load screen.');
    } finally {
      setLoading(false);
    }
  }, [screenId, page, limit]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const exportCsv = () => {
    if (!payload) return;
    const headers = ['ZIP', 'City', 'Metro', ...payload.columns.slice(3).map((c) => c.label)];
    const lines = [headers.join(',')];
    payload.rows.forEach((row) => {
      lines.push(
        [
          row.zip,
          `"${row.city ?? ''}"`,
          `"${row.metro}"`,
          ...payload.columns.slice(3).map((c) => cellValue(row, c.id)),
        ].join(','),
      );
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `real-estate-${screenId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="finance-shell">
      <WorkspacePageHeader theme={theme} onToggleTheme={toggleTheme} backHref={backHref} />
      <main className="finance-main">
        <section className="finance-report-panel finance-scroll mx-auto max-w-6xl p-4">
          {loading && !payload ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-[var(--v-fg-3)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading screen…
            </div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-red-500">{error}</p>
          ) : payload ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={backHref} className="text-xs text-[var(--v-fg-4)] underline-offset-2 hover:underline">
                    ← Real estate
                  </Link>
                  <h1 className="mt-1 text-lg font-semibold text-[var(--v-fg)]">{payload.title}</h1>
                  <p className="text-sm text-[var(--v-fg-3)]">{payload.description}</p>
                  <p className="mt-1 text-xs text-[var(--v-fg-4)]">
                    <span className="font-medium">Formula:</span> {payload.formula}
                  </p>
                </div>
                {!payload.preview && (
                  <button type="button" onClick={exportCsv} className="finance-secondary-btn flex items-center gap-2 text-sm">
                    <Download className="h-4 w-4" /> Export CSV
                  </button>
                )}
              </div>

              <PreviewBanner scanNote={payload.preview ? payload.scanNote : undefined} />

              {!payload.preview && payload.scanNote && (
                <p className="rounded-lg border border-[var(--v-border)] bg-[var(--v-surface)] px-3 py-2 text-xs text-[var(--v-fg-4)]">
                  {payload.scanNote}
                </p>
              )}

              <div className="overflow-x-auto rounded-xl border border-[var(--v-border)]">
                <table className="finance-screen-table w-full min-w-[800px] text-sm">
                  <thead>
                    <tr>
                      <th>S.No.</th>
                      {payload.columns.map((col) => (
                        <th key={col.id} className={col.align === 'right' ? 'text-right' : 'text-left'}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payload.rows.map((row, index) => (
                      <tr key={`${row.zip}-${index}`}>
                        <td>{(payload.page - 1) * payload.limit + index + 1}</td>
                        {payload.columns.map((col) => (
                          <td key={col.id} className={col.align === 'right' ? 'text-right' : 'text-left'}>
                            {col.id === 'zip' ? (
                              <Link
                                href={`/real-estate/zip/${row.zip}`}
                                className="font-medium underline-offset-2 hover:underline"
                              >
                                {row.zip}
                              </Link>
                            ) : (
                              cellValue(row, col.id)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!payload.preview && (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="text-[var(--v-fg-4)]">
                  Page {payload.page} of {payload.totalPages} · {payload.total} ZIPs
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="finance-input py-1 text-sm"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => p - 1)}
                    className="finance-secondary-btn"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={page >= payload.totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                    className="finance-secondary-btn"
                  >
                    Next
                  </button>
                </div>
              </div>
              )}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
