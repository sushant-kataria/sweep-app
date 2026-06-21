'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Loader2, Search, TrendingUp, Zap } from 'lucide-react';
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
import type { ScreenMatch } from '@/lib/stock-screen-engine';

type Props = {
  onSelectTicker: (ticker: string) => void;
  onSelectCompany?: (company: CompanySearchResult) => void;
};

type LoadedScreen = {
  tickers: string[];
  matches: ScreenMatch[];
  live: boolean;
  loading: boolean;
  error?: string;
};

function TickerChip({
  ticker,
  hint,
  onSelect,
}: {
  ticker: string;
  hint?: string;
  onSelect: (ticker: string) => void;
}) {
  return (
    <button type="button" className="finance-explore-ticker" onClick={() => onSelect(ticker)} title={hint}>
      <StockLogo ticker={ticker} size="sm" />
      <span>{ticker}</span>
    </button>
  );
}

function ScreenCard({
  screen,
  expanded,
  loaded,
  onToggle,
  onSelectTicker,
}: {
  screen: FinanceScreen;
  expanded: boolean;
  loaded?: LoadedScreen;
  onToggle: () => void;
  onSelectTicker: (ticker: string) => void;
}) {
  const count = loaded?.tickers.length ?? screen.tickers.length;
  const isLive = loaded?.live ?? screen.mode === 'live';

  return (
    <article className={`finance-explore-card ${expanded ? 'finance-explore-card--open' : ''}`}>
      <button type="button" className="finance-explore-card-head" onClick={onToggle}>
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
        <span className="finance-explore-card-count">{loaded?.loading ? '…' : `${count} stocks`}</span>
      </button>
      {expanded && (
        <div className="finance-explore-ticker-panel">
          {loaded?.loading && (
            <p className="finance-explore-loading">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {screen.mode === 'live' ? 'Running live scan…' : 'Loading…'}
            </p>
          )}
          {loaded?.error && <p className="text-sm text-red-500">{loaded.error}</p>}
          {!loaded?.loading && (
            <div className="finance-explore-ticker-grid">
              {(loaded?.tickers ?? screen.tickers).map((ticker) => {
                const match = loaded?.matches.find((m) => m.ticker === ticker);
                return (
                  <TickerChip key={ticker} ticker={ticker} hint={match?.hint} onSelect={onSelectTicker} />
                );
              })}
            </div>
          )}
          {isLive && !loaded?.loading && loaded?.live && (
            <p className="finance-explore-live-note text-[11px] text-[var(--v-fg-5)]">
              Live matches from {screen.formula} — scanned US large-cap universe.
            </p>
          )}
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
  const [screenData, setScreenData] = useState<Record<string, LoadedScreen>>({});

  const filteredScreens = useMemo(() => searchFinanceScreens(screenQuery), [screenQuery]);
  const filteredSectors = useMemo(() => searchFinanceSectors(screenQuery), [screenQuery]);

  const loadScreen = useCallback(async (screen: FinanceScreen) => {
    setScreenData((prev) => {
      const existing = prev[screen.id];
      if (existing?.loading) return prev;
      return {
        ...prev,
        [screen.id]: {
          tickers: screen.tickers,
          matches: existing?.matches ?? [],
          live: existing?.live ?? false,
          loading: true,
        },
      };
    });

    try {
      const res = await fetch(`/api/finance/screens/${encodeURIComponent(screen.id)}`);
      const data = (await res.json()) as {
        tickers?: string[];
        matches?: ScreenMatch[];
        live?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Scan failed.');
      setScreenData((prev) => ({
        ...prev,
        [screen.id]: {
          tickers: data.tickers ?? screen.tickers,
          matches: data.matches ?? [],
          live: data.live ?? false,
          loading: false,
        },
      }));
    } catch (e) {
      setScreenData((prev) => ({
        ...prev,
        [screen.id]: {
          tickers: screen.tickers,
          matches: [],
          live: false,
          loading: false,
          error: e instanceof Error ? e.message : 'Scan failed.',
        },
      }));
    }
  }, []);

  const toggleScreen = (screen: FinanceScreen) => {
    const next = expandedScreen === screen.id ? null : screen.id;
    setExpandedScreen(next);
    if (next && !screenData[screen.id]) void loadScreen(screen);
  };

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
          — search companies, browse sectors, or open a screen. Live screens run standard market formulas on Yahoo
          price data.
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
            <SectorCard
              key={sector.id}
              sector={sector}
              expanded={expandedSector === sector.id}
              onToggle={() => setExpandedSector((id) => (id === sector.id ? null : sector.id))}
              onSelectTicker={onSelectTicker}
            />
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
                <ScreenCard
                  key={screen.id}
                  screen={screen}
                  expanded={expandedScreen === screen.id}
                  loaded={screenData[screen.id]}
                  onToggle={() => toggleScreen(screen)}
                  onSelectTicker={onSelectTicker}
                />
              ))}
            </div>
          </section>
        );
      })}

      <p className="finance-explore-footnote text-[11px] text-[var(--v-fg-5)]">
        India-specific screens (FII in INR, penny stocks under ₹10, intraday lists) are adapted for US SEC filers.
        Fundamental screens use curated starter sets + documented formulas; live scans cover price/volume criteria.
        Full XBRL tables on{' '}
        <Link href="/stock" className="underline-offset-2 hover:underline">
          Stock terminal
        </Link>
        .
      </p>
    </div>
  );
}
