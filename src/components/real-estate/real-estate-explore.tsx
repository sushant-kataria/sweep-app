'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Building2, ChevronRight, Search } from 'lucide-react';
import { formatDom, formatPct, formatUsd, formatYield } from '@/lib/real-estate-market/format';
import { searchRealEstateScreens } from '@/lib/real-estate-market/screens';
import type { MetroSummary } from '@/lib/real-estate-market/types';

type Props = {
  metros: MetroSummary[];
  generatedAt: string;
  source: string;
};

function MetroCard({ metro }: { metro: MetroSummary }) {
  return (
    <Link href={`/real-estate/markets/${metro.slug}`} className="finance-explore-card finance-explore-card-link">
      <div className="finance-explore-card-head finance-explore-card-head--link">
        <div>
          <h3 className="finance-explore-card-title">{metro.name}</h3>
          <p className="finance-explore-card-desc">
            {metro.zipCount} ZIPs · Median {formatUsd(metro.medianSalePrice, true)} · Yield {formatYield(metro.medianYield)}
          </p>
        </div>
        <span className="finance-explore-card-count">{formatDom(metro.medianDom)}</span>
        <ChevronRight className="finance-explore-card-chevron" aria-hidden />
      </div>
    </Link>
  );
}

function ScreenCard({ screen }: { screen: ReturnType<typeof searchRealEstateScreens>[number] }) {
  return (
    <Link href={`/real-estate/screens/${screen.id}`} className="finance-explore-card finance-explore-card-link">
      <div className="finance-explore-card-head finance-explore-card-head--link">
        <div>
          <h3 className="finance-explore-card-title">{screen.title}</h3>
          <p className="finance-explore-card-desc">{screen.description}</p>
          <p className="finance-explore-formula">
            <span className="finance-explore-formula-label">Formula</span> {screen.formula}
          </p>
        </div>
        <span className="finance-explore-card-count">{screen.category}</span>
        <ChevronRight className="finance-explore-card-chevron" aria-hidden />
      </div>
    </Link>
  );
}

export function RealEstateExplore({ metros, generatedAt, source }: Props) {
  const [query, setQuery] = useState('');

  const filteredMetros = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return metros;
    return metros.filter(
      (m) => m.name.toLowerCase().includes(q) || m.stateCode.toLowerCase().includes(q) || m.slug.includes(q),
    );
  }, [metros, query]);

  const filteredScreens = useMemo(() => searchRealEstateScreens(query), [query]);

  return (
    <div className="finance-explore">
      <div className="finance-explore-hero">
        <div className="finance-explore-hero-icon">
          <Building2 className="h-8 w-8 text-[var(--v-fg-3)]" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--v-fg)]">Real estate markets</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--v-fg-3)]">
          US metro and ZIP-level investor data from free public sources — Redfin market tracker, FRED mortgage rates.
          No paid listing APIs. Rent is estimated via the 0.7% rule until HUD FMR is merged.
        </p>
        <p className="mt-2 text-[11px] text-[var(--v-fg-5)]">
          Seed updated {new Date(generatedAt).toLocaleDateString()} ·{' '}
          <a href={source} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
            Data source
          </a>
          . Investor screens & deal analyzer require{' '}
          <a href="/login?returnPathname=%2Freal-estate" className="underline-offset-2 hover:underline">
            free sign-in
          </a>{' '}
          — <a href="/pricing" className="underline-offset-2 hover:underline">pricing</a>.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/real-estate/deal-analyzer" className="finance-primary-btn text-sm">
          Open deal analyzer
        </Link>
      </div>

      <div className="finance-explore-search-block">
        <label className="finance-field">
          <span>Filter markets & screens</span>
          <div className="finance-explore-filter-wrap">
            <Search className="finance-explore-filter-icon" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by metro, state, or screen name…"
              className="finance-input"
            />
          </div>
        </label>
      </div>

      <section className="finance-explore-section">
        <div className="finance-explore-section-head">
          <h2 className="finance-explore-section-title">Investor screens</h2>
          <span className="finance-explore-section-count">{filteredScreens.length}</span>
        </div>
        <div className="finance-explore-grid">
          {filteredScreens.map((screen) => (
            <ScreenCard key={screen.id} screen={screen} />
          ))}
        </div>
      </section>

      <section className="finance-explore-section">
        <div className="finance-explore-section-head">
          <h2 className="finance-explore-section-title">Metros</h2>
          <span className="finance-explore-section-count">{filteredMetros.length}</span>
        </div>
        <div className="finance-explore-grid">
          {filteredMetros.map((metro) => (
            <MetroCard key={metro.slug} metro={metro} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function MetroDetailView({ metro }: { metro: MetroSummary }) {
  return (
    <div className="finance-explore">
      <div className="finance-explore-hero">
        <h1 className="text-xl font-semibold text-[var(--v-fg)]">{metro.name}</h1>
        <p className="mt-1 text-sm text-[var(--v-fg-3)]">
          {metro.zipCount} ZIPs · Median price {formatUsd(metro.medianSalePrice)} · Est. rent {formatUsd(metro.medianRent)}/mo ·
          Yield {formatYield(metro.medianYield)} · DOM {formatDom(metro.medianDom)} · YoY {formatPct((metro.priceYoy ?? 0) * 100)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--v-border)]">
        <table className="finance-screen-table w-full min-w-[720px] text-sm">
          <thead>
            <tr>
              <th className="text-left">ZIP</th>
              <th className="text-left">City</th>
              <th className="text-right">Median price</th>
              <th className="text-right">Est. rent</th>
              <th className="text-right">Yield</th>
              <th className="text-right">DOM</th>
              <th className="text-right">Price YoY</th>
              <th className="text-right">Deal score</th>
            </tr>
          </thead>
          <tbody>
            {metro.zips.map((z) => (
              <tr key={z.zip}>
                <td>
                  <Link href={`/real-estate/zip/${z.zip}`} className="font-medium underline-offset-2 hover:underline">
                    {z.zip}
                  </Link>
                </td>
                <td>{z.city ?? '—'}</td>
                <td className="text-right">{formatUsd(z.medianSalePrice, true)}</td>
                <td className="text-right">{formatUsd(z.estMonthlyRent)}</td>
                <td className="text-right">{formatYield(z.grossYield)}</td>
                <td className="text-right">{formatDom(z.medianDom)}</td>
                <td className="text-right">{formatPct(z.priceYoy != null ? z.priceYoy * 100 : null)}</td>
                <td className="text-right">{z.dealScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ZipDetailView({ zip }: { zip: import('@/lib/real-estate-market/types').ZipMarketRow }) {
  return (
    <div className="finance-explore">
      <div className="finance-explore-hero">
        <h1 className="text-xl font-semibold text-[var(--v-fg)]">
          {zip.city ? `${zip.city}, ${zip.stateCode}` : `ZIP ${zip.zip}`}
        </h1>
        <p className="mt-1 text-sm text-[var(--v-fg-3)]">
          ZIP {zip.zip} · {zip.metro} · Period ending {zip.periodEnd}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Median sale price', formatUsd(zip.medianSalePrice)],
          ['Est. monthly rent', formatUsd(zip.estMonthlyRent)],
          ['Gross yield', formatYield(zip.grossYield)],
          ['Days on market', formatDom(zip.medianDom)],
          ['Price YoY', formatPct(zip.priceYoy != null ? zip.priceYoy * 100 : null)],
          ['Deal score', String(zip.dealScore)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[var(--v-border)] bg-[var(--v-surface)] p-4">
            <p className="text-[11px] uppercase tracking-wide text-[var(--v-fg-5)]">{label}</p>
            <p className="mt-1 text-lg font-semibold text-[var(--v-fg)]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/real-estate/markets/${zip.metroSlug}`} className="finance-secondary-btn text-sm">
          ← Back to {zip.metro}
        </Link>
        <Link
          href={`/real-estate/deal-analyzer?price=${zip.medianSalePrice ?? ''}&rent=${zip.estMonthlyRent ?? ''}`}
          className="finance-primary-btn text-sm"
        >
          Analyze this ZIP
        </Link>
      </div>
    </div>
  );
}
