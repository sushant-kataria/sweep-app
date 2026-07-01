'use client';

import { useEffect, useState } from 'react';

type DemoPhase = 'finance' | 'stock' | 'realty';

const PHASES: DemoPhase[] = ['finance', 'stock', 'realty'];

const DEMO: Record<
  DemoPhase,
  { file: string; lines: Array<{ text: string; delay: number; accent?: boolean; dim?: boolean }> }
> = {
  finance: {
    file: 'finance-report.ts',
    lines: [
      { text: '// Sweep Finance — institutional extraction', dim: true, delay: 0 },
      { text: 'const report = await sweep.finance({', delay: 400 },
      { text: '  ticker: "AAPL",', delay: 200 },
      { text: '  source: "10-K",', delay: 200 },
      { text: '  period: "FY 2024",', delay: 200 },
      { text: '});', delay: 200 },
      { text: '', delay: 300 },
      { text: 'report.assets.cashAndEquivalents  →  29,943', accent: true, delay: 500 },
      { text: 'report.assets.total              →  352,755', accent: true, delay: 350 },
      { text: 'report.liabilities.total         →  290,437', accent: true, delay: 350 },
      { text: 'report.metrics.currentRatio      →  0.87', accent: true, delay: 350 },
      { text: '', delay: 400 },
      { text: '✓ PDF report ready for download', dim: true, delay: 300 },
    ],
  },
  stock: {
    file: 'stock-screener.ts',
    lines: [
      { text: '// SEC XBRL screener + live market data', dim: true, delay: 0 },
      { text: 'const screener = await sweep.stock({', delay: 400 },
      { text: '  ticker: "NVDA",', delay: 200 },
      { text: '  range: "1Y",', delay: 200 },
      { text: '  sections: ["pl", "cashflow", "ratios"],', delay: 200 },
      { text: '});', delay: 200 },
      { text: '', delay: 300 },
      { text: 'screener.price.last              →  892.50', accent: true, delay: 450 },
      { text: 'screener.revenue.ttm             →  60.9B', accent: true, delay: 350 },
      { text: 'screener.ratios.grossMargin      →  72.7%', accent: true, delay: 350 },
      { text: 'screener.peers.rank              →  #1 Semis', accent: true, delay: 350 },
      { text: '', delay: 400 },
      { text: '→ open full balance sheet in Finance', dim: true, delay: 300 },
    ],
  },
  realty: {
    file: 'real-estate-screens.ts',
    lines: [
      { text: '// Redfin ZIP markets + investor screens', dim: true, delay: 0 },
      { text: 'const market = await sweep.realEstate({', delay: 400 },
      { text: '  metro: "Austin, TX",', delay: 200 },
      { text: '  screen: "top-deals",', delay: 200 },
      { text: '  source: "redfin",', delay: 200 },
      { text: '});', delay: 200 },
      { text: '', delay: 300 },
      { text: 'market.zip.medianPrice           →  525,000', accent: true, delay: 450 },
      { text: 'market.zip.grossYield            →  8.4%', accent: true, delay: 350 },
      { text: 'market.zip.dealScore             →  87', accent: true, delay: 350 },
      { text: 'market.mortgageRate              →  6.75% (FRED)', accent: true, delay: 350 },
      { text: '', delay: 400 },
      { text: '→ run deal analyzer on this ZIP', dim: true, delay: 300 },
    ],
  },
};

const BALANCE_ROWS = [
  { label: 'Cash & equivalents', value: '29,943', section: 'assets' },
  { label: 'Accounts receivable', value: '33,410', section: 'assets' },
  { label: 'Total current assets', value: '120,154', section: 'total' },
  { label: 'Property & equipment', value: '45,680', section: 'assets' },
  { label: 'Total assets', value: '352,755', section: 'total' },
  { label: 'Accounts payable', value: '68,960', section: 'liab' },
  { label: 'Long-term debt', value: '95,281', section: 'liab' },
  { label: 'Total equity', value: '62,318', section: 'total' },
];

const SCREENER_ROWS = [
  { label: 'Revenue (TTM)', value: '$60.9B', section: 'assets' },
  { label: 'Gross profit', value: '$44.3B', section: 'assets' },
  { label: 'Operating income', value: '$32.9B', section: 'total' },
  { label: 'Net income', value: '$29.8B', section: 'assets' },
  { label: 'Free cash flow', value: '$27.1B', section: 'total' },
  { label: 'Gross margin', value: '72.7%', section: 'liab' },
  { label: 'P/E ratio', value: '65.2x', section: 'liab' },
  { label: 'Debt / equity', value: '0.18', section: 'total' },
];

const REALTY_ROWS = [
  { label: 'ZIP 78701 · Austin', value: '$620K', section: 'assets' },
  { label: 'Est. rent / mo', value: '$4,340', section: 'assets' },
  { label: 'Gross yield', value: '8.4%', section: 'total' },
  { label: 'Price YoY', value: '-2.1%', section: 'assets' },
  { label: 'Days on market', value: '28d', section: 'liab' },
  { label: 'Deal score', value: '87', section: 'total' },
  { label: 'Mortgage (FRED)', value: '6.75%', section: 'liab' },
  { label: 'Monthly cash flow', value: '+$412', section: 'total' },
];

function rowsForPhase(phase: DemoPhase) {
  if (phase === 'finance') return BALANCE_ROWS;
  if (phase === 'stock') return SCREENER_ROWS;
  return REALTY_ROWS;
}

function sheetTitle(phase: DemoPhase) {
  if (phase === 'finance') return 'Balance Sheet';
  if (phase === 'stock') return 'Income & Ratios';
  return 'ZIP Market Scan';
}

function sheetMeta(phase: DemoPhase) {
  if (phase === 'finance') return 'AAPL · FY 2024 · USD M';
  if (phase === 'stock') return 'NVDA · SEC XBRL · USD';
  return '78701 · Austin, TX · Redfin';
}

export function AnimatedReportPanel() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);
  const [cursorOn, setCursorOn] = useState(true);

  const phase = PHASES[phaseIdx];
  const demo = DEMO[phase];
  const rows = rowsForPhase(phase);

  useEffect(() => {
    const blink = setInterval(() => setCursorOn((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  useEffect(() => {
    setVisibleLines(0);
    setVisibleRows(0);

    const timers: ReturnType<typeof setTimeout>[] = [];

    let acc = 0;
    demo.lines.forEach((entry, i) => {
      acc += entry.delay;
      timers.push(setTimeout(() => setVisibleLines(i + 1), acc));
    });

    const lineTotalMs = acc + 800;

    rows.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleRows(i + 1), 1200 + i * 280));
    });

    timers.push(
      setTimeout(() => {
        setPhaseIdx((p) => (p + 1) % PHASES.length);
      }, lineTotalMs + rows.length * 280 + 2000),
    );

    return () => timers.forEach(clearTimeout);
  }, [phaseIdx, demo.lines, rows.length]);

  return (
    <div className="home-demo-panel">
      <div className="home-demo-glow" aria-hidden />

      <div className="home-demo-window">
        <div className="home-demo-titlebar">
          <div className="home-demo-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="home-demo-tabs">
            {PHASES.map((p) => (
              <span key={p} className={`home-demo-tab ${p === phase ? 'home-demo-tab--active' : ''}`}>
                {DEMO[p].file}
              </span>
            ))}
          </div>
          <span className="home-demo-status font-mono">running</span>
        </div>

        <div className="home-demo-body">
          <div className="home-demo-code font-mono">
            <div className="home-demo-line home-demo-line--dim">
              <span className="home-demo-ln">1</span>
              <span>sweep v1.0 — workspace</span>
            </div>
            {demo.lines.slice(0, visibleLines).map((entry, i) => (
              <div
                key={`${phase}-${i}`}
                className={`home-demo-line home-demo-line--in ${entry.dim ? 'home-demo-line--dim' : ''} ${entry.accent ? 'home-demo-line--accent' : ''}`}
              >
                <span className="home-demo-ln">{i + 2}</span>
                <span>{entry.text}</span>
              </div>
            ))}
            {visibleLines === demo.lines.length && (
              <div className="home-demo-line">
                <span className="home-demo-ln">{demo.lines.length + 2}</span>
                <span className={`home-demo-cursor ${cursorOn ? 'home-demo-cursor--on' : ''}`}>▍</span>
              </div>
            )}
          </div>

          <div className="home-demo-sheet">
            <div className="home-demo-sheet-head">
              <span className="font-pixel text-[11px] sm:text-xs">{sheetTitle(phase)}</span>
              <span className="font-mono text-[10px] text-[var(--home-muted)]">{sheetMeta(phase)}</span>
            </div>
            <div className="home-demo-sheet-rows font-mono">
              {rows.slice(0, visibleRows).map((row, i) => (
                <div
                  key={row.label}
                  className={`home-demo-sheet-row home-demo-sheet-row--in ${row.section === 'total' ? 'home-demo-sheet-row--total' : ''}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
