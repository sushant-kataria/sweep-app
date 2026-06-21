'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronRight, Search, TrendingUp, Zap } from 'lucide-react';
import { CompanySearch } from '@/components/finance/company-search';
import type { CompanySearchResult } from '@/lib/company-types';
import {
  FINANCE_SCREEN_CATEGORIES,
  FINANCE_SECTORS,
  searchFinanceScreens,
  searchFinanceSectors,
  type FinanceScreen,
  type FinanceSector,
} from '@/lib/finance-screens';

type Props = {
  onSelectTicker: (ticker: string) => void;
  onSelectCompany?: (company: CompanySearchResult) => void;
};

function ScreenLinkCard({ screen }: { screen: FinanceScreen }) {
  return (
    <Link href={`/finance/screens/${screen.id}`} className="finance-explore-card finance-explore-card-link">
      <div className="finance-explore-card-head finance-explore-card-head--link">
        <div>
          <div className="finance-explore-card-title-row">
            <h3 className="finance-explore-card-title">{screen.title}</h3>
            {screen.mode === 'live' && (
              <span className="finance-explore-live-badge" title="Live formula scan">
                <Zap className="h-3 w-3" aria-hidden />
                Live
              </span>
            )}
          </div>
          <p className="finance-explore-card-desc">{screen.description}</p>
          {screen.formula && (
            <p className="finance-explore-formula">
              <span className="finance-explore-formula-label">Formula</span> {screen.formula}
            </p>
          )}
        </div>
        <span className="finance-explore-card-count">{screen.tickers.length} stocks</span>
        <ChevronRight className="finance-explore-card-chevron" aria-hidden />
      </div>
    </Link>
  );
}

function SectorLinkCard({ sector }: { sector: FinanceSector }) {
  return (
    <Link href={`/finance/sectors/${sector.id}`} className="finance-explore-sector finance-explore-card-link">
      <div className="finance-explore-sector-head finance-explore-card-head--link">
        <div>
          <h3 className="finance-explore-sector-title">{sector.label}</h3>
          <p className="finance-explore-sector-desc">{sector.description}</p>
        </div>
        <span className="finance-explore-card-count">{sector.tickers.length}</span>
        <ChevronRight className="finance-explore-card-chevron" aria-hidden />
      </div>
    </Link>
  );
}

export function FinanceExplore({ onSelectTicker, onSelectCompany }: Props) {
  const [screenQuery, setScreenQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null);

  const filteredScreens = useMemo(() => searchFinanceScreens(screenQuery), [screenQuery]);
  const filteredSectors = useMemo(() => searchFinanceSectors(screenQuery), [screenQuery]);

  const handleCompanyPick = (company: CompanySearchResult) => {
    setSelectedCompany(company);
    onSelectCompany?.(company);
    onSelectTicker(company.ticker);
  };

  return (
    <div className="finance-explore">
      <div className="finance-explore-hero">
        <div className="finance-explore-hero-icon">
          <TrendingUp className="h-8 w-8 text-[var(--v-fg-3)]" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--v-fg)]">Stock screens</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--v-fg-3)]">
          Explore US SEC filers like{' '}
          <a href="https://www.screener.in/explore/" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
            screener.in
          </a>
          — open any screen for a full results table, pagination, and customizable search queries.
        </p>
      </div>

      <div className="finance-explore-search-block">
        <label className="finance-field">
          <span>Search company</span>
          <CompanySearch
            value={selectedCompany}
            onChange={setSelectedCompany}
            onSelect={handleCompanyPick}
            placeholder="Search ticker or company name (e.g. AAPL, DOX, Ford)"
          />
        </label>
        <label className="finance-field">
          <span>Filter screens & sectors</span>
          <div className="finance-explore-filter-wrap">
            <Search className="finance-explore-filter-icon" aria-hidden />
            <input
              type="search"
              value={screenQuery}
              onChange={(e) => setScreenQuery(e.target.value)}
              placeholder="Filter by screen name, formula, or ticker…"
              className="finance-input finance-explore-filter-input"
            />
          </div>
        </label>
      </div>

      <section className="finance-explore-section">
        <div className="finance-explore-section-head">
          <h2 className="finance-explore-section-title">Sectors</h2>
        </div>
        <div className="finance-explore-sector-grid">
          {filteredSectors.map((sector) => (
            <SectorLinkCard key={sector.id} sector={sector} />
          ))}
        </div>
      </section>

      {FINANCE_SCREEN_CATEGORIES.map((cat) => {
        const screens = filteredScreens.filter((s) => s.category === cat.id);
        if (screens.length === 0) return null;
        return (
          <section key={cat.id} className="finance-explore-section">
            <h2 className="finance-explore-section-title">{cat.label}</h2>
            {cat.subtitle && <p className="finance-explore-section-subtitle">{cat.subtitle}</p>}
            <div className="finance-explore-screen-list">
              {screens.map((screen) => (
                <ScreenLinkCard key={screen.id} screen={screen} />
              ))}
            </div>
          </section>
        );
      })}

      <p className="finance-explore-footnote text-[11px] text-[var(--v-fg-5)]">
        Each screen opens a dedicated page with all matching stocks, pagination, and a customizable query editor.
        Full XBRL fundamentals on{' '}
        <Link href="/stock" className="underline-offset-2 hover:underline">
          Stock terminal
        </Link>
        .
      </p>
    </div>
  );
}
