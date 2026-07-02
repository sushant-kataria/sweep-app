'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Zap } from 'lucide-react';
import { FreeSampleBadge, FreeSampleBanner, FreeSampleTableFooter } from '@/components/auth/free-sample-banner';
import { StockLogo } from '@/components/stock/stock-logo';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';
import { formatVolume } from '@/lib/market-enrich';
import type { ScreenColumnDef, ScreenResultRow, ScreenResultsPayload } from '@/lib/screen-result-types';

type Props = {
  screenId: string;
  kind?: 'screen' | 'sector';
  backHref?: string;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function formatPrice(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPe(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toFixed(2);
}

function formatMarketCap(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const billions = value / 1e9;
  if (billions >= 1) return billions.toFixed(2);
  return (value / 1e6).toFixed(0);
}

function formatPct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatScore(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toFixed(2);
}

function cellValue(row: ScreenResultRow, col: ScreenColumnDef): string {
  switch (col.id) {
    case 'price':
      return formatPrice(row.price);
    case 'pe':
      return formatPe(row.pe);
    case 'marketCap':
      return formatMarketCap(row.marketCap);
    case 'volume':
      return formatVolume(row.volume);
    case 'changePct':
      return formatPct(row.changePct);
    case 'score':
      return formatScore(row.score);
    case 'rsi':
      return formatScore(row.rsi);
    case 'signal':
      return row.signal ?? '—';
    default:
      return '—';
  }
}

function exportCsv(payload: ScreenResultsPayload) {
  const headers = ['S.No.', 'Ticker', 'Name', ...payload.columns.map((c) => c.altLabel ?? c.label)];
  const lines = [headers.join(',')];

  payload.rows.forEach((row, index) => {
    const serial = (payload.page - 1) * payload.limit + index + 1;
    const values = [
      serial,
      row.ticker,
      `"${row.companyName.replace(/"/g, '""')}"`,
      ...payload.columns.map((col) => {
        const raw = cellValue(row, col);
        return raw.includes(',') ? `"${raw}"` : raw;
      }),
    ];
    lines.push(values.join(','));
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${payload.id}-page-${payload.page}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ScreenResultsContent({ screenId, kind = 'screen', backHref = '/finance/explore' }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useSweepTheme();

  const initialPage = Number(searchParams.get('page') ?? '1');
  const initialLimit = Number(searchParams.get('limit') ?? '25');
  const initialQuery = searchParams.get('query') ?? '';

  const [payload, setPayload] = useState<ScreenResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(PAGE_SIZE_OPTIONS.includes(initialLimit) ? initialLimit : 25);
  const [queryText, setQueryText] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  const apiBase = kind === 'sector' ? '/api/finance/sectors' : '/api/finance/screens';

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (activeQuery.trim()) params.set('query', activeQuery.trim());

      const res = await fetch(`${apiBase}/${encodeURIComponent(screenId)}?${params.toString()}`);
      const data = (await res.json()) as ScreenResultsPayload & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load screen results.');
      setPayload(data);
      if (!activeQuery && data.query) setQueryText(data.query);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load screen results.');
    } finally {
      setLoading(false);
    }
  }, [activeQuery, apiBase, limit, page, screenId]);

  useEffect(() => {
    void fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (limit !== 25) params.set('limit', String(limit));
    if (activeQuery.trim()) params.set('query', activeQuery.trim());
    const qs = params.toString();
    const base = kind === 'sector' ? `/finance/sectors/${screenId}` : `/finance/screens/${screenId}`;
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
  }, [activeQuery, kind, limit, page, router, screenId]);

  const pageNumbers = useMemo(() => {
    if (!payload) return [];
    const { totalPages } = payload;
    const current = payload.page;
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [payload]);

  const runQuery = () => {
    setPage(1);
    setActiveQuery(queryText.trim());
  };

  return (
    <div className="finance-shell">
      <WorkspacePageHeader theme={theme} onToggleTheme={toggleTheme} backHref={backHref} />

      <main className="finance-main screen-results-main">
        <section className="screen-results-panel finance-scroll">
          {loading && !payload && (
            <div className="screen-results-loading">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              Running screen…
            </div>
          )}

          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

          {payload && (
            <>
              <header className="screen-results-header">
                <div>
                  <div className="screen-results-title-row">
                    <h1 className="screen-results-title">{payload.title}</h1>
                    {payload.live && (
                      <span className="finance-explore-live-badge">
                        <Zap className="h-3 w-3" aria-hidden />
                        Live
                      </span>
                    )}
                    {payload.preview && payload.samplePreview && (
                      <FreeSampleBadge shown={payload.samplePreview.shown} total={payload.samplePreview.total} />
                    )}
                    {payload.fallback && (
                      <span className="screen-results-fallback-badge">Starter list</span>
                    )}
                  </div>
                  <p className="screen-results-desc">{payload.description}</p>
                  {payload.formula && (
                    <p className="screen-results-formula">
                      <span className="finance-explore-formula-label">Formula</span> {payload.formula}
                    </p>
                  )}
                  {payload.preview && payload.samplePreview ? (
                    <FreeSampleBanner preview={payload.samplePreview} />
                  ) : (
                    payload.scanNote && <p className="screen-results-scan-note">{payload.scanNote}</p>
                  )}
                </div>
              </header>

              <div className="screen-results-toolbar">
                {payload.preview && payload.samplePreview ? (
                  <FreeSampleBadge
                    shown={payload.samplePreview.shown}
                    total={payload.samplePreview.total}
                  />
                ) : (
                  <p className="screen-results-count">
                    {`${payload.total.toLocaleString()} results found: Showing page ${payload.page} of ${payload.totalPages}`}
                  </p>
                )}
                <div className="screen-results-toolbar-actions">
                  {!payload.preview && (
                  <button
                    type="button"
                    className="finance-secondary-btn screen-results-export-btn"
                    onClick={() => exportCsv(payload)}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    Export
                  </button>
                  )}
                </div>
              </div>

              <div className={`screen-results-table-wrap ${loading ? 'screen-results-table-wrap--loading' : ''}`}>
                {loading && (
                  <div className="screen-results-table-overlay" aria-live="polite">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  </div>
                )}
                <table className="screen-results-table">
                  <thead>
                    <tr>
                      <th>S.No.</th>
                      <th>Name</th>
                      {payload.columns.map((col) => (
                        <th key={col.id}>{col.altLabel ?? col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payload.rows.map((row, index) => {
                      const serial = (payload.page - 1) * payload.limit + index + 1;
                      return (
                        <tr key={row.ticker}>
                          <td>{serial}</td>
                          <td>
                            <Link href={`/stock?ticker=${encodeURIComponent(row.ticker)}`} className="screen-results-name-link">
                              <StockLogo ticker={row.ticker} companyName={row.companyName} size="sm" />
                              <span>
                                <strong>{row.companyName}</strong>
                                <span className="screen-results-ticker">{row.ticker}</span>
                              </span>
                            </Link>
                          </td>
                          {payload.columns.map((col) => (
                            <td key={col.id} className={col.id === 'signal' ? 'screen-results-signal' : undefined}>
                              {cellValue(row, col)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                  {payload.preview && payload.samplePreview && (
                    <FreeSampleTableFooter
                      preview={payload.samplePreview}
                      colSpan={2 + payload.columns.length}
                    />
                  )}
                </table>

                {payload.rows.length === 0 && (
                  <p className="screen-results-empty">No stocks matched your query. Try relaxing the filters.</p>
                )}
              </div>

              {!payload.preview && (
                <>
                  <div className="screen-results-pagination">
                    <button
                      type="button"
                      className="finance-secondary-btn"
                      disabled={payload.page <= 1 || loading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </button>
                    <div className="screen-results-page-list">
                      {pageNumbers.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`screen-results-page-btn ${n === payload.page ? 'screen-results-page-btn--active' : ''}`}
                          disabled={loading}
                          onClick={() => setPage(n)}
                        >
                          {n}
                        </button>
                      ))}
                      {payload.totalPages > pageNumbers[pageNumbers.length - 1] && (
                        <>
                          <span className="screen-results-page-ellipsis">…</span>
                          <button
                            type="button"
                            className="screen-results-page-btn"
                            disabled={loading}
                            onClick={() => setPage(payload.totalPages)}
                          >
                            {payload.totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      className="finance-secondary-btn"
                      disabled={payload.page >= payload.totalPages || loading}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </button>
                    <label className="screen-results-page-size">
                      Results per page
                      <select
                        value={limit}
                        disabled={loading}
                        onChange={(e) => {
                          setLimit(Number(e.target.value));
                          setPage(1);
                        }}
                      >
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <section className="screen-results-query">
                    <h2 className="screen-results-query-title">Search Query</h2>
                    <p className="screen-results-query-help">You can customize the query below:</p>
                    <label className="finance-field">
                      <span>Query</span>
                      <textarea
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                        rows={4}
                        className="finance-input screen-results-query-input"
                        placeholder={'Market cap > 10 AND\nP/E < 25'}
                      />
                    </label>
                    <p className="screen-results-query-example">
                      Custom query example:{' '}
                      <code>Market cap &gt; 10 AND P/E &lt; 15 AND RSI &lt; 30</code>
                    </p>
                    <p className="screen-results-query-note">
                      Market cap is in billions (USD). Use AND to combine conditions. Fundamental columns like ROCE require
                      the{' '}
                      <Link href="/stock" className="underline-offset-2 hover:underline">
                        stock terminal
                      </Link>{' '}
                      for full XBRL data.
                    </p>
                    <button type="button" className="finance-primary-btn screen-results-run-btn" disabled={loading} onClick={runQuery}>
                      Run this Query
                    </button>
                  </section>
                </>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export function ScreenResultsView(props: Props) {
  return (
    <Suspense fallback={<div className="finance-shell min-h-dvh bg-[var(--v-bg)]" />}>
      <ScreenResultsContent {...props} />
    </Suspense>
  );
}
