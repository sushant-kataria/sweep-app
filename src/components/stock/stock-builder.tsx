'use client';

import { useState } from 'react';
import { BarChart3, LineChart, Search } from 'lucide-react';
import { DEFAULT_STOCK_TICKER, STOCK_OPTIONS, STOCK_SECTORS, getStocksBySector } from '@/lib/stock-data';
import { buildStockSession } from '@/lib/stock-session';
import type { StockSession } from '@/lib/stock-types';

type SourceTab = 'watchlist' | 'ticker' | 'sector';

type Props = {
  onSession: (session: StockSession) => void;
  onError: (msg: string) => void;
};

export function StockBuilder({ onSession, onError }: Props) {
  const [tab, setTab] = useState<SourceTab>('watchlist');
  const [ticker, setTicker] = useState(DEFAULT_STOCK_TICKER);
  const [sector, setSector] = useState(STOCK_SECTORS[0] ?? 'Technology');
  const [customTicker, setCustomTicker] = useState('');

  const loadTicker = (symbol: string) => {
    onError('');
    const session = buildStockSession(symbol);
    if (!session) {
      onError(`No equity profile for ${symbol.toUpperCase()} yet. Try AAPL, NVDA, or MSFT.`);
      return;
    }
    onSession(session);
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
        Build a research view in seconds — then ask grounded questions in the analyst chat.
      </p>

      <div className="finance-source-tabs">
        {(
          [
            { id: 'watchlist' as const, label: 'Top watchlist', icon: BarChart3 },
            { id: 'ticker' as const, label: 'Ticker lookup', icon: Search },
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
            <button type="button" onClick={() => loadTicker(ticker)} className="finance-primary-btn">
              Open research view
            </button>
            <p className="text-[11px] text-[var(--v-fg-4)]">
              Pre-loaded price history, fundamentals, and peer comps for top US mega-caps.
            </p>
          </>
        )}

        {tab === 'ticker' && (
          <>
            <label className="finance-field">
              <span>Ticker symbol</span>
              <input
                type="text"
                value={customTicker}
                onChange={(e) => setCustomTicker(e.target.value.toUpperCase())}
                placeholder="e.g. NVDA"
                className="finance-input"
              />
            </label>
            <button
              type="button"
              onClick={() => loadTicker(customTicker || ticker)}
              className="finance-primary-btn"
            >
              Load equity profile
            </button>
            <p className="text-[11px] text-[var(--v-fg-4)]">
              Supported: {STOCK_OPTIONS.map((s) => s.ticker).join(', ')}.
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
            <button type="button" onClick={() => loadTicker(ticker)} className="finance-primary-btn">
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