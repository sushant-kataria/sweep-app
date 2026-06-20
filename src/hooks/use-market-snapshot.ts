'use client';

import { useEffect, useState } from 'react';
import type { MarketRange, MarketSnapshot } from '@/lib/market-types';

export function useMarketSnapshot(ticker: string, range: MarketRange) {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    void (async () => {
      try {
        const res = await fetch(`/api/market/snapshot?ticker=${encodeURIComponent(ticker)}&range=${range}`);
        const data = (await res.json()) as MarketSnapshot & { error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Market data unavailable.');
        if (!cancelled) setSnapshot(data);
      } catch (e) {
        if (!cancelled) {
          setSnapshot(null);
          setError(e instanceof Error ? e.message : 'Market data unavailable.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ticker, range]);

  const displaySnapshot = snapshot?.range === range ? snapshot : null;

  return { snapshot, displaySnapshot, loading, error };
}
