'use client';

import { useState } from 'react';
import {
  getStockLogoFallbackSources,
  getStockLogoUrl,
  tickerInitials,
} from '@/lib/stock-logo';

const SIZES = {
  xs: 18,
  sm: 22,
  md: 28,
  lg: 36,
  xl: 48,
} as const;

type Props = {
  ticker: string;
  companyName?: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Drop outer border — for use inside badges/chips. */
  plain?: boolean;
};

export function StockLogo({ ticker, companyName, size = 'md', className = '', plain = false }: Props) {
  const [sourceIdx, setSourceIdx] = useState(0);
  const sources = getStockLogoFallbackSources(ticker);
  const px = SIZES[size];
  const normalized = ticker.trim();

  if (!normalized) return null;

  const exhausted = sourceIdx >= sources.length;
  const url = exhausted ? null : getStockLogoUrl(normalized, sources[sourceIdx]);

  return (
    <span
      className={`stock-logo stock-logo--${size}${plain ? ' stock-logo--plain' : ''} ${className}`.trim()}
      style={{ width: px, height: px }}
      title={companyName ?? normalized.toUpperCase()}
      aria-hidden={exhausted ? undefined : true}
    >
      {exhausted ? (
        <span className="stock-logo-fallback">{tickerInitials(normalized)}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url!}
          alt=""
          width={px}
          height={px}
          loading="lazy"
          decoding="async"
          onError={() => setSourceIdx((i) => i + 1)}
        />
      )}
    </span>
  );
}
