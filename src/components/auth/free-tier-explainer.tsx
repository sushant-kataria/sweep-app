'use client';

import Link from 'next/link';
import { FREE_SAMPLE_ROWS } from '@/lib/free-tier';

export function FreeTierExplainer() {
  return (
    <div className="free-tier-explainer">
      <p className="free-tier-explainer-title">How free samples work</p>
      <p className="free-tier-explainer-desc">
        Sweep is free to browse. You get real market data — not fake placeholders — with intentional limits so you can
        try the product before paying. Pro ($19/mo) removes those limits.
      </p>
      <ul className="free-tier-explainer-list">
        <li>
          <strong>Investor screens</strong> — first {FREE_SAMPLE_ROWS} rows free; Pro shows every match with pagination
          &amp; export
        </li>
        <li>
          <strong>Finance reports</strong> — Top 25 SEC demos free; Pro adds live EDGAR, PDF upload &amp; URL analysis
        </li>
        <li>
          <strong>Deal analyzer</strong> — read-only example free; Pro runs your own numbers
        </li>
        <li>
          <strong>AI chat</strong> — Pro only
        </li>
      </ul>
      <Link href="/pricing" className="free-tier-explainer-link">
        Compare Free vs Pro →
      </Link>
    </div>
  );
}
