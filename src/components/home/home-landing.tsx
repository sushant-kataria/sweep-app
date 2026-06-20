'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Building2,
  FileSpreadsheet,
  LineChart,
  Search,
  Table2,
  TrendingUp,
} from 'lucide-react';
import { AnimatedReportPanel } from './animated-report-panel';
import { HeroTypewriter } from './hero-typewriter';

const PILLARS = [
  {
    id: 'finance',
    icon: FileSpreadsheet,
    label: 'Finance',
    tag: '10-K · balance sheet · institutional report',
    description:
      'Pull any Top 25 US filer instantly, upload your own 10-K, or paste an annual report URL. Sweep extracts line items, computes liquidity and leverage ratios, and generates a downloadable institutional report.',
    href: '/finance',
    cta: 'Open Finance',
    accent: 'home-pillar--finance',
  },
  {
    id: 'stock',
    icon: LineChart,
    label: 'Stock Terminal',
    tag: 'live chart · SEC XBRL · peer comps',
    description:
      'Screen mega-caps or search any SEC filer. Live price charts sit alongside quarterly results, P&L, balance sheet, cash flow, ratios, and peer comparisons — all parsed from EDGAR filings.',
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
      'Search properties, model rental portfolios, and pull Zillow-style comps — grounded answers with map-ready visualizations.',
    href: '/real-estate',
    cta: 'Open Real Estate',
    accent: 'home-pillar--realty',
  },
] as const;

const CAPABILITIES = [
  {
    icon: Search,
    title: 'SEC company search',
    description: 'Index-backed lookup across US filers. Jump straight to a ticker from any workspace.',
  },
  {
    icon: Table2,
    title: 'XBRL financial tables',
    description: 'Quarterly results, P&L, balance sheet, cash flow, and ratios parsed from EDGAR — not scraped summaries.',
  },
  {
    icon: TrendingUp,
    title: 'Live market charts',
    description: '6-month, 1-year, and 5-year price history alongside fundamentals in the same split view.',
  },
  {
    icon: BarChart3,
    title: 'Peer comparison',
    description: 'Compare watchlist tickers on key metrics. Screen in Stock, then open the full balance sheet in Finance.',
  },
] as const;

const QUICK_START = [
  { ticker: 'AAPL', label: 'Apple balance sheet', href: '/finance?ticker=AAPL&generate=1' },
  { ticker: 'NVDA', label: 'NVIDIA screener', href: '/stock?ticker=NVDA' },
  { ticker: 'WMT', label: 'Walmart analysis', href: '/finance?ticker=WMT&generate=1' },
  { ticker: 'MSFT', label: 'Microsoft terminal', href: '/stock?ticker=MSFT' },
] as const;

export function HomeLanding() {
  return (
    <div className="home-landing">
      <div className="home-grid" aria-hidden />
      <div className="home-gradient" aria-hidden />

      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-hero-badge font-mono">SEC filings · live quotes · XBRL tables</p>

          <h1 className="home-hero-title font-pixel">
            Intelligence
            <br />
            <HeroTypewriter />
          </h1>

          <p className="home-hero-lead">
            A developer-first equity research workspace. Screen live markets with SEC financials, generate
            institutional balance sheet reports, and ask grounded questions — all in one split-view terminal.
          </p>

          <div className="home-hero-actions">
            <Link href="/stock" className="home-btn home-btn--primary">
              Open Stock
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/finance" className="home-btn home-btn--ghost">
              Open Finance
            </Link>
            <Link href="/stock?ticker=NVDA" className="home-btn home-btn--ghost">
              Try NVDA
            </Link>
          </div>

          <div className="home-stats font-mono">
            <div>
              <span className="home-stat-value font-pixel">25+</span>
              <span className="home-stat-label">US filers pre-loaded</span>
            </div>
            <div>
              <span className="home-stat-value font-pixel">SEC</span>
              <span className="home-stat-label">XBRL financial tables</span>
            </div>
            <div>
              <span className="home-stat-value font-pixel">Live</span>
              <span className="home-stat-label">Price charts & peer comps</span>
            </div>
          </div>
        </div>

        <AnimatedReportPanel />
      </section>

      <section className="home-capabilities">
        <div className="home-section-head">
          <p className="home-section-kicker font-mono">equity research</p>
          <h2 className="home-section-title font-pixel">Filings and markets, side by side.</h2>
          <p className="home-capabilities-lead">
            Stock combines live quotes with EDGAR-parsed financials. Finance goes deeper with full balance sheet
            extraction, metrics, and downloadable reports. Start anywhere — cross-link when you need more depth.
          </p>
        </div>
        <div className="home-capability-grid">
          {CAPABILITIES.map((item) => (
            <article key={item.title} className="home-capability">
              <div className="home-capability-icon">
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <h3 className="home-capability-title font-pixel">{item.title}</h3>
              <p className="home-capability-desc">{item.description}</p>
            </article>
          ))}
        </div>
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

      <section className="home-quickstart">
        <div className="home-section-head">
          <p className="home-section-kicker font-mono">quick start</p>
          <h2 className="home-section-title font-pixel">Jump in with one click.</h2>
        </div>
        <div className="home-quickstart-grid">
          {QUICK_START.map((item) => (
            <Link key={item.ticker} href={item.href} className="home-quickstart-card font-mono">
              <span className="home-quickstart-ticker font-pixel">{item.ticker}</span>
              <span className="home-quickstart-label">{item.label}</span>
              <ArrowRight className="home-quickstart-arrow h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      </section>

      <section className="home-api">
        <div className="home-api-copy">
          <p className="home-section-kicker font-mono">how it works</p>
          <h2 className="home-section-title font-pixel">From ticker to report in seconds</h2>
          <p className="home-api-desc">
            Pre-loaded mega-cap filers return instantly. Upload a PDF or paste a filing URL for custom analysis.
            The stock screener pulls structured XBRL from EDGAR — every chat answer stays grounded in the numbers.
          </p>
        </div>
        <div className="home-api-stack">
          <div className="home-api-code font-mono">
            <div className="home-api-code-bar">
              <span>GET /api/stock/NVDA/screener</span>
            </div>
            <pre className="home-api-pre">
              <code>{`// → quarterly results, P&L, balance sheet,
//   cash flow, ratios, SEC documents

{
  "ticker": "NVDA",
  "quarterlyResults": [...],
  "tables": { "incomeStatement": {...}, ... }
}`}</code>
            </pre>
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

// → balance sheet, metrics, analysis, PDF`}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
