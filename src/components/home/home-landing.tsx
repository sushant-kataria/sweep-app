'use client';

import Link from 'next/link';
import { ArrowRight, Building2, FileSpreadsheet, LineChart } from 'lucide-react';
import { AnimatedReportPanel } from './animated-report-panel';
import { HeroTypewriter } from './hero-typewriter';

const PILLARS = [
  {
    id: 'finance',
    icon: FileSpreadsheet,
    label: 'Finance',
    tag: '10-K · earnings · balance sheet',
    description:
      'Upload annual reports or pull Top 25 US filings. Sweep extracts line items, computes ratios, and generates institutional-grade analysis.',
    href: '/finance',
    cta: 'Open Finance',
    accent: 'home-pillar--finance',
  },
  {
    id: 'markets',
    icon: LineChart,
    label: 'Stock Markets',
    tag: 'charts · comps · fundamentals',
    description:
      'Ask for price history, sector comparisons, and balance sheets inline. Live dashboards render next to your conversation.',
    href: '/stock',
    cta: 'Open Stock',
    accent: 'home-pillar--markets',
  },
  {
    id: 'realty',
    icon: Building2,
    label: 'Real Estate',
    tag: 'listings · portfolio · comps',
    description:
      'Search properties, model portfolios, and pull Zillow-style comps — grounded answers with map-ready visualizations.',
    href: '/real-estate',
    cta: 'Open Real Estate',
    accent: 'home-pillar--realty',
  },
] as const;

export function HomeLanding() {
  return (
    <div className="home-landing">
      <div className="home-grid" aria-hidden />
      <div className="home-gradient" aria-hidden />

      <section className="home-hero">
        <div className="home-hero-content">
          <h1 className="home-hero-title font-pixel">
            Intelligence
            <br />
            <HeroTypewriter />
          </h1>

          <p className="home-hero-lead">
            A developer-first AI workspace for filings, live markets, and property data.
            Upload a 10-K, query NVDA, or scan listings — reports and charts appear instantly.
          </p>

          <div className="home-hero-actions">
            <Link href="/finance" className="home-btn home-btn--primary">
              Open Finance
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/stock" className="home-btn home-btn--ghost">
              Open Stock
            </Link>
          </div>

          <div className="home-stats font-mono">
            <div>
              <span className="home-stat-value font-pixel">25+</span>
              <span className="home-stat-label">US filers pre-loaded</span>
            </div>
            <div>
              <span className="home-stat-value font-pixel">PDF</span>
              <span className="home-stat-label">Upload & analyze</span>
            </div>
            <div>
              <span className="home-stat-value font-pixel">Live</span>
              <span className="home-stat-label">Charts & comps</span>
            </div>
          </div>
        </div>

        <AnimatedReportPanel />
      </section>

      <section className="home-pillars">
        <div className="home-section-head">
          <p className="home-section-kicker font-mono">product</p>
          <h2 className="home-section-title font-pixel">Three engines. One workspace.</h2>
        </div>
        <div className="home-pillar-grid">
          {PILLARS.map((pillar) => (
            <article key={pillar.id} className={`home-pillar ${pillar.accent}`}>
              <div className="home-pillar-icon">
                <pillar.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <p className="home-pillar-tag font-mono">{pillar.tag}</p>
              <h3 className="home-pillar-title font-pixel">{pillar.label}</h3>
              <p className="home-pillar-desc">{pillar.description}</p>
              <Link href={pillar.href} className="home-pillar-link font-mono">
                {pillar.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-api">
        <div className="home-api-copy">
          <p className="home-section-kicker font-mono">how it works</p>
          <h2 className="home-section-title font-pixel">From document to report in seconds</h2>
          <p className="home-api-desc">
            Sweep reads your source material, structures the balance sheet, computes liquidity and leverage metrics,
            and keeps every chat answer grounded in the numbers.
          </p>
        </div>
        <div className="home-api-code font-mono">
          <div className="home-api-code-bar">
            <span>POST /api/finance/analyze</span>
          </div>
          <pre className="home-api-pre">
            <code>{`{
  "source": "upload",
  "doc": { "text": "…", "mimeType": "application/pdf" },
  "fileName": "AAPL-10K.pdf"
}

// → balance sheet, metrics, analysis, PDF download`}</code>
          </pre>
        </div>
      </section>

    </div>
  );
}