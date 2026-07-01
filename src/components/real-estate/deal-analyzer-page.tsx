'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';
import { formatUsd, formatYield } from '@/lib/real-estate-market/format';
import type { DealAnalyzerResult } from '@/lib/real-estate-market/types';

function DealAnalyzerForm() {
  const searchParams = useSearchParams();
  const [purchasePrice, setPurchasePrice] = useState('');
  const [downPaymentPct, setDownPaymentPct] = useState('20');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('400');
  const [result, setResult] = useState<DealAnalyzerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateHint, setRateHint] = useState('');

  useEffect(() => {
    const price = searchParams.get('price');
    const rent = searchParams.get('rent');
    if (price) setPurchasePrice(price);
    if (rent) setMonthlyRent(rent);
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/real-estate/mortgage-rate')
      .then((r) => r.json())
      .then((d) => {
        if (d.rate && !interestRate) setInterestRate(String(d.rate));
        setRateHint(d.source ?? '');
      })
      .catch(() => undefined);
  }, [interestRate]);

  const analyze = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/real-estate/deal-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchasePrice: Number(purchasePrice),
          downPaymentPct: Number(downPaymentPct),
          interestRate: Number(interestRate),
          monthlyRent: Number(monthlyRent),
          monthlyExpenses: Number(monthlyExpenses),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed.');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="finance-explore max-w-3xl">
      <div className="finance-explore-hero">
        <h1 className="text-xl font-semibold text-[var(--v-fg)]">Deal analyzer</h1>
        <p className="mt-1 text-sm text-[var(--v-fg-3)]">
          Manual deal input — no street-level comps. Uses FRED 30-year mortgage rate when you leave rate blank.
        </p>
        {rateHint && <p className="mt-1 text-[11px] text-[var(--v-fg-5)]">{rateHint}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="finance-field">
          <span>Purchase price ($)</span>
          <input className="finance-input" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
        </label>
        <label className="finance-field">
          <span>Down payment (%)</span>
          <input className="finance-input" value={downPaymentPct} onChange={(e) => setDownPaymentPct(e.target.value)} />
        </label>
        <label className="finance-field">
          <span>Interest rate (%)</span>
          <input className="finance-input" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
        </label>
        <label className="finance-field">
          <span>Monthly rent ($)</span>
          <input className="finance-input" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} />
        </label>
        <label className="finance-field sm:col-span-2">
          <span>Monthly expenses — tax, insurance, maintenance ($)</span>
          <input className="finance-input" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(e.target.value)} />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={analyze} disabled={loading} className="finance-primary-btn flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Run analysis
        </button>
        <Link href="/real-estate" className="finance-secondary-btn">
          ← Markets
        </Link>
      </div>

      {result && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ['Monthly cash flow', formatUsd(result.monthlyCashFlow)],
            ['Annual cash flow', formatUsd(result.annualCashFlow)],
            ['Monthly mortgage', formatUsd(result.monthlyMortgage)],
            ['Gross yield', formatYield(result.grossYield)],
            ['Cap rate (net)', formatYield(result.capRate)],
            ['Cash-on-cash', formatYield(result.cashOnCash)],
            ['Break-even rent', formatUsd(result.breakEvenRent)],
            ['Deal score', String(result.dealScore)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[var(--v-border)] bg-[var(--v-surface)] p-4">
              <p className="text-[11px] uppercase tracking-wide text-[var(--v-fg-5)]">{label}</p>
              <p className="mt-1 text-lg font-semibold text-[var(--v-fg)]">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DealAnalyzerPageContent() {
  const { theme, toggleTheme } = useSweepTheme();
  return (
    <div className="finance-shell">
      <WorkspacePageHeader theme={theme} onToggleTheme={toggleTheme} backHref="/real-estate" />
      <main className="finance-main">
        <section className="finance-report-panel finance-scroll mx-auto max-w-4xl p-4">
          <DealAnalyzerForm />
        </section>
      </main>
    </div>
  );
}

export function DealAnalyzerPage() {
  return (
    <Suspense fallback={<div className="finance-shell min-h-dvh bg-[var(--v-bg)]" />}>
      <DealAnalyzerPageContent />
    </Suspense>
  );
}
