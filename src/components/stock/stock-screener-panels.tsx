'use client';

import type { FinancialTable, StockKeyMetric, StockProsCons, StockDocumentLink, GrowthStat } from '@/lib/stock-screener-types';

function formatCell(value: number | null, unit: string): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (unit.includes('%') || unit.includes('Ratio')) {
    return value.toFixed(2);
  }
  const sign = value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toLocaleString('en-US')}`;
}

export function StockKeyMetricsGrid({ metrics }: { metrics: StockKeyMetric[] }) {
  return (
    <div className="stock-key-metrics">
      {metrics.map((m) => (
        <div key={m.label} className="stock-key-metric">
          <span className="stock-key-metric-label">{m.label}</span>
          <span className="stock-key-metric-value">{m.value}</span>
        </div>
      ))}
    </div>
  );
}

export function StockFinancialTable({ table }: { table: FinancialTable }) {
  const section = sectionId(table.title);
  if (!table.periods.length) {
    return (
      <section className="stock-financial-section" id={section}>
        <h2 className="stock-section-title">{table.title}</h2>
        <p className="text-sm text-[var(--v-fg-4)]">
          No SEC XBRL data for this section. Some foreign issuers file 20-F/6-K instead of 10-K/10-Q — if you
          expected data here, the filing may use tags we do not parse yet.
        </p>
      </section>
    );
  }

  return (
    <section className="stock-financial-section" id={sectionId(table.title)}>
      <div className="stock-section-header">
        <h2 className="stock-section-title">{table.title}</h2>
        {table.subtitle && <p className="stock-section-subtitle">{table.subtitle}</p>}
      </div>
      <div className="stock-table-wrap">
        <table className="stock-table">
          <thead>
            <tr>
              <th className="stock-table-sticky">Line item</th>
              {table.periods.map((p) => (
                <th key={p.key}>{p.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.label} className={row.highlight ? 'stock-table-row--highlight' : ''}>
                <td className="stock-table-sticky">{row.label}</td>
                {row.values.map((val, i) => (
                  <td key={`${row.label}-${table.periods[i]?.key ?? i}`}>{formatCell(val, table.unit)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function StockGrowthGrid({ stats }: { stats: GrowthStat[] }) {
  return (
    <div className="stock-growth-grid">
      {stats.map((s) => (
        <div key={s.label} className="stock-growth-card">
          <span className="stock-growth-label">{s.label}</span>
          <span className="stock-growth-value">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

export function StockProsConsPanel({ prosCons }: { prosCons: StockProsCons }) {
  return (
    <div className="stock-pros-cons">
      <div className="stock-pros-cons-col stock-pros-cons-col--pro">
        <h3 className="stock-pros-cons-title">Pros</h3>
        <ul>
          {prosCons.pros.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="stock-pros-cons-col stock-pros-cons-col--con">
        <h3 className="stock-pros-cons-title">Cons</h3>
        <ul>
          {prosCons.cons.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function StockDocumentsList({ documents }: { documents: StockDocumentLink[] }) {
  if (!documents.length) {
    return (
      <section className="stock-financial-section" id="documents">
        <h2 className="stock-section-title">Documents</h2>
        <p className="text-sm text-[var(--v-fg-4)]">
          No recent 10-K, 10-Q, 20-F, or 6-K links found. Check SEC EDGAR directly for this filer.
        </p>
      </section>
    );
  }
  return (
    <section className="stock-financial-section" id="documents">
      <h2 className="stock-section-title">Documents</h2>
      <ul className="stock-documents">
        {documents.map((doc) => (
          <li key={doc.url}>
            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="stock-document-link">
              {doc.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const STOCK_SECTIONS = [
  { id: 'summary', label: 'Summary' },
  { id: 'chart', label: 'Chart' },
  { id: 'peers', label: 'Peers' },
  { id: 'quarterly-results', label: 'Quarters' },
  { id: 'profit-loss', label: 'Profit & Loss' },
  { id: 'balance-sheet', label: 'Balance Sheet' },
  { id: 'cash-flow', label: 'Cash Flow' },
  { id: 'ratios', label: 'Ratios' },
  { id: 'documents', label: 'Documents' },
] as const;

function sectionId(title: string): string {
  const map: Record<string, string> = {
    'Quarterly results': 'quarterly-results',
    'Profit & Loss': 'profit-loss',
    'Balance sheet': 'balance-sheet',
    'Cash flows': 'cash-flow',
    Ratios: 'ratios',
  };
  return (
    map[title] ??
    title
      .toLowerCase()
      .replace(/&/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

export function StockSectionNav({ active }: { active?: string }) {
  return (
    <nav className="stock-section-nav" aria-label="Stock page sections">
      {STOCK_SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`stock-section-nav-link ${active === s.id ? 'stock-section-nav-link--active' : ''}`}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}
