// components/dashboard/balance-sheet.tsx
'use client';

type BalanceSheetProps = {
  title: string;
  period: string;
  currency: string;
  assets: {
    current: Array<{ label: string; value: number }>;
    nonCurrent: Array<{ label: string; value: number }>;
  };
  liabilities: {
    current: Array<{ label: string; value: number }>;
    nonCurrent: Array<{ label: string; value: number }>;
  };
  equity: Array<{ label: string; value: number }>;
};

export const BalanceSheet = ({
  title,
  period,
  currency,
  assets,
  liabilities,
  equity,
}: BalanceSheetProps) => {
  const formatValue = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const calculateTotal = (items: Array<{ value: number }>) => {
    return items.reduce((sum, item) => sum + item.value, 0);
  };

  const totalCurrentAssets = calculateTotal(assets.current);
  const totalNonCurrentAssets = calculateTotal(assets.nonCurrent);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const totalCurrentLiabilities = calculateTotal(liabilities.current);
  const totalNonCurrentLiabilities = calculateTotal(liabilities.nonCurrent);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

  const totalEquity = calculateTotal(equity);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  return (
    <div className="rounded-lg border border-[var(--v-chart-card-border)] bg-white p-4 text-[var(--v-chart-fg)] dark:bg-[var(--v-chart-card-bg)]">
      <div className="mb-4">
        <h3 className="font-mono text-sm font-semibold text-[var(--v-chart-fg)] mb-1">{title}</h3>
        <p className="font-mono text-xs text-[var(--v-chart-muted)]">
          Period: {period} | Currency: {currency} millions
        </p>
      </div>

      <div className="space-y-4 text-xs font-mono">
        {/* ASSETS */}
        <div>
          <h4 className="mb-2 font-bold uppercase text-[var(--v-chart-fg)]">Assets</h4>

          {/* Current Assets */}
          <div className="mb-3">
            <p className="mb-1 text-[var(--v-chart-tick)]">Current Assets:</p>
            {assets.current.map((item, i) => (
              <div key={i} className="flex justify-between py-0.5 pl-4 text-[var(--v-chart-muted)]">
                <span>{item.label}</span>
                <span>{formatValue(item.value)}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-[var(--v-chart-card-border)] pt-1 pl-4 text-[var(--v-chart-fg)]">
              <span>Total Current Assets</span>
              <span>{formatValue(totalCurrentAssets)}</span>
            </div>
          </div>

          {/* Non-Current Assets */}
          <div className="mb-2">
            <p className="mb-1 text-[var(--v-chart-tick)]">Non-Current Assets:</p>
            {assets.nonCurrent.map((item, i) => (
              <div key={i} className="flex justify-between py-0.5 pl-4 text-[var(--v-chart-muted)]">
                <span>{item.label}</span>
                <span>{formatValue(item.value)}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-[var(--v-chart-card-border)] pt-1 pl-4 text-[var(--v-chart-fg)]">
              <span>Total Non-Current Assets</span>
              <span>{formatValue(totalNonCurrentAssets)}</span>
            </div>
          </div>

          <div className="mt-2 flex justify-between border-t-2 border-[var(--v-chart-card-border)] pt-2 font-bold text-[var(--v-chart-fg)]">
            <span>TOTAL ASSETS</span>
            <span>{formatValue(totalAssets)}</span>
          </div>
        </div>

        {/* LIABILITIES */}
        <div className="border-t border-[var(--v-chart-card-border)] pt-4">
          <h4 className="mb-2 font-bold uppercase text-[var(--v-chart-fg)]">Liabilities</h4>

          {/* Current Liabilities */}
          <div className="mb-3">
            <p className="mb-1 text-[var(--v-chart-tick)]">Current Liabilities:</p>
            {liabilities.current.map((item, i) => (
              <div key={i} className="flex justify-between py-0.5 pl-4 text-[var(--v-chart-muted)]">
                <span>{item.label}</span>
                <span>{formatValue(item.value)}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-[var(--v-chart-card-border)] pt-1 pl-4 text-[var(--v-chart-fg)]">
              <span>Total Current Liabilities</span>
              <span>{formatValue(totalCurrentLiabilities)}</span>
            </div>
          </div>

          {/* Non-Current Liabilities */}
          <div className="mb-2">
            <p className="mb-1 text-[var(--v-chart-tick)]">Non-Current Liabilities:</p>
            {liabilities.nonCurrent.map((item, i) => (
              <div key={i} className="flex justify-between py-0.5 pl-4 text-[var(--v-chart-muted)]">
                <span>{item.label}</span>
                <span>{formatValue(item.value)}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-[var(--v-chart-card-border)] pt-1 pl-4 text-[var(--v-chart-fg)]">
              <span>Total Non-Current Liabilities</span>
              <span>{formatValue(totalNonCurrentLiabilities)}</span>
            </div>
          </div>

          <div className="mt-2 flex justify-between border-t-2 border-[var(--v-chart-card-border)] pt-2 font-bold text-[var(--v-chart-fg)]">
            <span>TOTAL LIABILITIES</span>
            <span>{formatValue(totalLiabilities)}</span>
          </div>
        </div>

        {/* EQUITY */}
        <div className="border-t border-[var(--v-chart-card-border)] pt-4">
          <h4 className="mb-2 font-bold uppercase text-[var(--v-chart-fg)]">Shareholders&apos; Equity</h4>
          {equity.map((item, i) => (
            <div key={i} className="flex justify-between py-0.5 pl-4 text-[var(--v-chart-muted)]">
              <span>{item.label}</span>
              <span>{formatValue(item.value)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t-2 border-[var(--v-chart-card-border)] pt-2 font-bold text-[var(--v-chart-fg)]">
            <span>TOTAL EQUITY</span>
            <span>{formatValue(totalEquity)}</span>
          </div>
        </div>

        {/* TOTAL L+E */}
        <div className="flex justify-between border-t-2 border-[var(--v-chart-card-border)] pt-2 font-bold text-[var(--v-chart-fg)]">
          <span>TOTAL LIABILITIES + EQUITY</span>
          <span>{formatValue(totalLiabilitiesAndEquity)}</span>
        </div>
      </div>
    </div>
  );
};
