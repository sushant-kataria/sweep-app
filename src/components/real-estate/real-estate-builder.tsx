'use client';

import { useState } from 'react';
import { Building2, MapPin, PieChart } from 'lucide-react';
import { DEFAULT_MARKET_ID, MARKET_OPTIONS } from '@/lib/real-estate-data';
import { buildMarketSession, buildPortfolioSession } from '@/lib/real-estate-session';
import type { RealEstateSession } from '@/lib/real-estate-types';

type SourceTab = 'market' | 'portfolio';

type Props = {
  onSession: (session: RealEstateSession) => void;
  onError: (msg: string) => void;
};

export function RealEstateBuilder({ onSession, onError }: Props) {
  const [tab, setTab] = useState<SourceTab>('market');
  const [marketId, setMarketId] = useState(DEFAULT_MARKET_ID);

  const loadMarket = () => {
    onError('');
    const session = buildMarketSession(marketId);
    if (!session) {
      onError('Could not load market profile. Try another metro.');
      return;
    }
    onSession(session);
  };

  const loadPortfolio = () => {
    onError('');
    onSession(buildPortfolioSession());
  };

  return (
    <div className="finance-builder">
      <div className="finance-builder-icon">
        <Building2 className="h-8 w-8 text-[var(--v-fg-3)]" />
      </div>
      <h1 className="text-xl font-semibold text-[var(--v-fg)]">Property intelligence workspace</h1>
      <p className="mt-1 max-w-lg text-sm text-[var(--v-fg-3)]">
        Scan housing markets, model rental portfolios, and analyze cap rates across metros.
        Sweep surfaces listings, yield metrics, and institutional-grade market commentary.
      </p>

      <div className="finance-source-tabs">
        {(
          [
            { id: 'market' as const, label: 'Market scan', icon: MapPin },
            { id: 'portfolio' as const, label: 'Portfolio demo', icon: PieChart },
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
        {tab === 'market' && (
          <>
            <label className="finance-field">
              <span>Metro market</span>
              <select value={marketId} onChange={(e) => setMarketId(e.target.value)} className="finance-input">
                {MARKET_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.metro}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={loadMarket} className="finance-primary-btn">
              Scan market
            </button>
            <p className="text-[11px] text-[var(--v-fg-4)]">
              Curated listings, median price/rent, cap rates, and days-on-market for major US metros.
            </p>
          </>
        )}

        {tab === 'portfolio' && (
          <>
            <p className="text-sm text-[var(--v-fg-3)]">
              Load a diversified four-property portfolio across LA, Austin, Miami, and Brooklyn with rental income,
              appreciation, and occupancy metrics.
            </p>
            <button type="button" onClick={loadPortfolio} className="finance-primary-btn">
              Open portfolio view
            </button>
            <p className="text-[11px] text-[var(--v-fg-4)]">
              Demo assets for yield modeling, cap-rate benchmarking, and grounded property Q&A.
            </p>
          </>
        )}
      </div>

      <p className="mt-4 text-[11px] text-[var(--v-fg-5)]">
        Educational analysis only — not investment advice. Verify figures with local MLS and tax records.
      </p>
    </div>
  );
}