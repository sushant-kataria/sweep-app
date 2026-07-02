'use client';

import Link from 'next/link';
import { FREE_SAMPLE_ROWS } from '@/lib/free-tier';

export function RealEstateToolsGuide() {
  return (
    <div className="free-tier-explainer">
      <p className="free-tier-explainer-title">How to use Sweep for real estate</p>
      <p className="free-tier-explainer-desc">
        Start free. Every number comes from real public data, not placeholders. When a tool fits your search, upgrade
        to Pro for full lists, exports, and your own deal inputs.
      </p>
      <ul className="free-tier-explainer-list">
        <li>
          <strong>Market map:</strong> Search a city or metro, click a pin, and see median price, rent, yield, and deal
          score. Good for spotting neighborhoods to research first.
        </li>
        <li>
          <strong>Investor screens:</strong> Ready-made lists like high yield, price dips, and fast-selling ZIPs. Free
          shows {FREE_SAMPLE_ROWS} rows; Pro shows every match with pagination and CSV export.
        </li>
        <li>
          <strong>Deal analyzer:</strong> Enter price, down payment, rate, and rent to see cash flow, cap rate, and deal
          score. Free shows a read-only example; Pro runs your numbers.
        </li>
        <li>
          <strong>Metro and ZIP pages:</strong> Open any market for a full table, then jump into the deal analyzer with
          one click.
        </li>
      </ul>
      <Link href="/pricing" className="free-tier-explainer-link">
        Compare Free vs Pro
      </Link>
    </div>
  );
}
