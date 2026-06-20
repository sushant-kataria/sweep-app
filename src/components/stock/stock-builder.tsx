'use client';

import { useState } from 'react';
import { BarChart3, LineChart, Loader2, Search } from 'lucide-react';
import { CompanySearch } from '@/components/finance/company-search';
import type { CompanySearchResult } from '@/lib/company-types';
import { loadStockSessionByTicker } from '@/lib/stock-client';
import { DEFAULT_STOCK_TICKER, STOCK_OPTIONS, STOCK_SECTORS, getStocksBySector } from '@/lib/stock-data';
import { buildStockSession } from '@/lib/stock-session';
import type { StockSession } from '@/lib/stock-types';

type SourceTab = 'watchlist' | 'sec' | 'sector';

const DEFAULT_COMPANY: CompanySearchResult = {
  cik: '0000320193',
  ticker: 'AAPL',
  name: 'Apple Inc.',
};

type Props = {
  onSession: (session: StockSession) => void;
  onError: (msg: string) => void;
};

export function StockBuilder({ onSession, onError }: Props) {
  const [tab, setTab] = useState<SourceTab>('sec');
  const [ticker, setTicker] = useState(DEFAULT_STOCK_TICKER);
  const [sector, setSector] = useState(STOCK_SECTORS[0] ?? 'Technology');
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(false);

  const loadTicker = async (symbol: string) => {
    onError('');
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) {
      onError('Select or search for a company first.');
      return;
    }

    const preloaded = buildStockSession(normalized);
    if (preloaded) {
      onSession(preloaded);
      return;
    }

    setLoading(true);
    try {
      const session = await loadStockSessionByTicker(normalized);
      onSession(session);
    } catch (e) {
      onError(e instanceof Error ? e.message : `No equity profile for ${normalized}.`);
    } finally {
      setLoading(false);
    }
  };

  const sectorStocks = getStocksBySector(sector);

  return (
    <div className="finance-builder">
      <div className="finance-builder-icon">
        <LineChart className="h-8 w-8 text-[var(--v-fg-3)]" />
      </div>
      <h1 className="text-xl font-semibold text-[var(--v-fg)]">Equity research terminal</h1>
      <p className="mt-1 max-w-lg text-sm text-[var(--v-fg-3)]">
        Screen mega-cap equities with price action, valuation multiples, and peer-relative positioning.
        Search any SEC filer or use the pre-loaded watchlist — then ask grounded questions in the analyst chat.
      </p>

      <div className="finance-source-tabs">
        {(
          [
            { id: 'sec' as const, label: 'SEC companies', icon: Search },
            { id: 'watchlist' as const, label: 'Top watchlist', icon: BarChart3 },
            { id: 'sector' as const, label: 'Sector screen', icon: LineChart },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`finance-source-tab ${tab === id ? 'finance-source-tab--active' : ''}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="finance-builder-form">
        {tab === 'sec' && (
          <>
            <CompanySearch
              value={selectedCompany}
              onChange={setSelectedCompany}
              disabled={loading}
              placeholder="Search ticker or company name (e.g. F, Ford)"
            />
            {selectedCompany && (
              <p className="text-[11px] text-[var(--v-fg-4)]">
                CIK {selectedCompany.cik} · SEC EDGAR filer
                {buildStockSession(selectedCompany.ticker) ? ' · full research profile' : ' · live market data'}
              </p>
            )}
            <button
              type="button"
              onClick={() => selectedCompany && loadTicker(selectedCompany.ticker)}
              disabled={loading || !selectedCompany}
              className="finance-primary-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                  Loading equity profile…
                </>
              ) : (
                'Open research view'
              )}
            </button>
          </>
        )}

        {tab === 'watchlist' && (
          <>
            <label className="finance-field">
              <span>Equity</span>
              <select value={ticker} onChange={(e) => setTicker(e.target.value)} className="finance-input">
                {STOCK_OPTIONS.map((s) => (
                  <option key={s.ticker} value={s.ticker}>
                    {s.name} ({s.ticker})
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => loadTicker(ticker)} disabled={loading} className="finance-primary-btn">
              Open research view
            </button>
            <p className="text-[11px] text-[var(--v-fg-4)]">
              Pre-loaded price history, fundamentals, and peer comps for top US mega-caps.
            </p>
          </>
        )}

        {tab === 'sector' && (
          <>
            <label className="finance-field">
              <span>Sector</span>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="finance-input">
                {STOCK_SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="finance-field">
              <span>Company</span>
              <select
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="finance-input"
              >
                {sectorStocks.map((s) => (
                  <option key={s.ticker} value={s.ticker}>
                    {s.name} ({s.ticker})
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => loadTicker(ticker)} disabled={loading} className="finance-primary-btn">
              Screen sector peer
            </button>
          </>
        )}
      </div>

      <p className="mt-4 text-[11px] text-[var(--v-fg-5)]">
        Educational research only — not investment advice. Verify figures against official filings and market data.
      </p>
    </div>
  );
}
