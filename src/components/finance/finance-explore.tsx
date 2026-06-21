'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { LayoutGrid, Search, TrendingUp } from 'lucide-react';
import { CompanySearch } from '@/components/finance/company-search';
import { StockLogo } from '@/components/stock/stock-logo';
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

function TickerChip({ ticker, onSelect }: { ticker: string; onSelect: (ticker: string) => void }) {
  return (
    <button type="button" className="finance-explore-ticker" onClick={() => onSelect(ticker)}>
      <StockLogo ticker={ticker} size="sm" />
      <span>{ticker}</span>
    </button>
  );
}

function ScreenCard({
  screen,
  expanded,
  onToggle,
  onSelectTicker,
}: {
  screen: FinanceScreen;
  expanded: boolean;
  onToggle: () => void;
  onSelectTicker: (ticker: string) => void;
}) {
  return (
    <article className={`finance-explore-card ${expanded ? 'finance-explore-card--open' : ''}`}>
      <button type="button" className="finance-explore-card-head" onClick={onToggle}>
        <div>
          <h3 className="finance-explore-card-title">{screen.title}</h3>
          <p className="finance-explore-card-desc">{screen.description}</p>
        </div>
        <span className="finance-explore-card-count">{screen.tickers.length} stocks</span>
      </button>
      {expanded && (
        <div className="finance-explore-ticker-grid">
          {screen.tickers.map((ticker) => (
            <TickerChip key={ticker} ticker={ticker} onSelect={onSelectTicker} />
          ))}
        </div>
      )}
    </article>
  );
}

function SectorCard({
  sector,
  expanded,
  onToggle,
  onSelectTicker,
}: {
  sector: FinanceSector;
  expanded: boolean;
  onToggle: () => void;
  onSelectTicker: (ticker: string) => void;
}) {
  return (
    <article className={`finance-explore-sector ${expanded ? 'finance-explore-sector--open' : ''}`}>
      <button type="button" className="finance-explore-sector-head" onClick={onToggle}>
        <div>
          <h3 className="finance-explore-sector-title">{sector.label}</h3>
          <p className="finance-explore-sector-desc">{sector.description}</p>
        </div>
        <span className="finance-explore-card-count">{sector.tickers.length}</span>
      </button>
      {expanded && (
        <div className="finance-explore-ticker-grid">
          {sector.tickers.map((ticker) => (
            <TickerChip key={ticker} ticker={ticker} onSelect={onSelectTicker} />
          ))}
        </div>
      )}
    </article>
  );
}

export function FinanceExplore({ onSelectTicker, onSelectCompany }: Props) {
  const [screenQuery, setScreenQuery] = useState('');
  const [expandedScreen, setExpandedScreen] = useState<string | null>(null);
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
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
        <h1 className="text-xl font-semibold text-[var(--v-fg)]">Explore SEC filers</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--v-fg-3)]">
          Screener.in-style stock screens for US companies — search any SEC filer, browse by sector, or open a
          curated screen to jump into balance sheet analysis.
        </p>
      </div>

      <div className="finance-explore-search-block">
        <label className="finance-field">
          <span>Search company</span>
          <CompanySearch
            value={selectedCompany}
            onChange={setSelectedCompany}
            onSelect={handleCompanyPick}
            placeholder="Search ticker or company name (e.g. AAPL, Walmart, DOX)"
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
              placeholder="Filter by screen name, theme, or ticker…"
              className="finance-input finance-explore-filter-input"
            />
          </div>
        </label>
      </div>

      <section className="finance-explore-section">
        <div className="finance-explore-section-head">
          <LayoutGrid className="h-4 w-4 text-[var(--v-fg-4)]" aria-hidden />
          <h2 className="finance-explore-section-title">Sectors</h2>
        </div>
        <div className="finance-explore-sector-grid">
          {filteredSectors.map((sector) => (
            <SectorCard
              key={sector.id}
              sector={sector}
              expanded={expandedSector === sector.id}
              onToggle={() => setExpandedSector((id) => (id === sector.id ? null : sector.id))}
              onSelectTicker={onSelectTicker}
            />
          ))}
        </div>
        {filteredSectors.length === 0 && (
          <p className="text-sm text-[var(--v-fg-4)]">No sectors match that filter.</p>
        )}
      </section>

      {FINANCE_SCREEN_CATEGORIES.map((cat) => {
        const screens = filteredScreens.filter((s) => s.category === cat.id);
        if (screens.length === 0) return null;
        return (
          <section key={cat.id} className="finance-explore-section">
            <h2 className="finance-explore-section-title">{cat.label}</h2>
            <div className="finance-explore-screen-list">
              {screens.map((screen) => (
                <ScreenCard
                  key={screen.id}
                  screen={screen}
                  expanded={expandedScreen === screen.id}
                  onToggle={() => setExpandedScreen((id) => (id === screen.id ? null : screen.id))}
                  onSelectTicker={onSelectTicker}
                />
              ))}
            </div>
          </section>
        );
      })}

      {filteredScreens.length === 0 && (
        <p className="text-sm text-[var(--v-fg-4)]">No stock screens match that filter.</p>
      )}

      <p className="finance-explore-footnote text-[11px] text-[var(--v-fg-5)]">
        Screens use curated US SEC filer lists (not live formula scans). For full screener tables and charts, open{' '}
        <Link href="/stock" className="underline-offset-2 hover:underline">
          Stock terminal
        </Link>
        . Inspired by{' '}
        <a
          href="https://www.screener.in/explore/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          screener.in/explore
        </a>
        .
      </p>
    </div>
  );
}
