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
  equity 
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
    <div className="bg-black border border-white/20 rounded p-4">
      <div className="mb-4">
        <h3 className="text-white font-mono text-sm mb-1">{title}</h3>
        <p className="text-white/60 font-mono text-xs">Period: {period} | Currency: {currency} millions</p>
      </div>

      <div className="space-y-4 text-xs font-mono">
        {/* ASSETS */}
        <div>
          <h4 className="text-white font-bold mb-2 uppercase">Assets</h4>
          
          {/* Current Assets */}
          <div className="mb-3">
            <p className="text-white/80 mb-1">Current Assets:</p>
            {assets.current.map((item, i) => (
              <div key={i} className="flex justify-between text-white/60 pl-4 py-0.5">
                <span>{item.label}</span>
                <span>{formatValue(item.value)}</span>
              </div>
            ))}
            <div className="flex justify-between text-white border-t border-white/10 mt-1 pt-1 pl-4">
              <span>Total Current Assets</span>
              <span>{formatValue(totalCurrentAssets)}</span>
            </div>
          </div>

          {/* Non-Current Assets */}
          <div className="mb-2">
            <p className="text-white/80 mb-1">Non-Current Assets:</p>
            {assets.nonCurrent.map((item, i) => (
              <div key={i} className="flex justify-between text-white/60 pl-4 py-0.5">
                <span>{item.label}</span>
                <span>{formatValue(item.value)}</span>
              </div>
            ))}
            <div className="flex justify-between text-white border-t border-white/10 mt-1 pt-1 pl-4">
              <span>Total Non-Current Assets</span>
              <span>{formatValue(totalNonCurrentAssets)}</span>
            </div>
          </div>

          <div className="flex justify-between text-white font-bold border-t-2 border-white/20 mt-2 pt-2">
            <span>TOTAL ASSETS</span>
            <span>{formatValue(totalAssets)}</span>
          </div>
        </div>

        {/* LIABILITIES */}
        <div className="pt-4 border-t border-white/20">
          <h4 className="text-white font-bold mb-2 uppercase">Liabilities</h4>
          
          {/* Current Liabilities */}
          <div className="mb-3">
            <p className="text-white/80 mb-1">Current Liabilities:</p>
            {liabilities.current.map((item, i) => (
              <div key={i} className="flex justify-between text-white/60 pl-4 py-0.5">
                <span>{item.label}</span>
                <span>{formatValue(item.value)}</span>
              </div>
            ))}
            <div className="flex justify-between text-white border-t border-white/10 mt-1 pt-1 pl-4">
              <span>Total Current Liabilities</span>
              <span>{formatValue(totalCurrentLiabilities)}</span>
            </div>
          </div>

          {/* Non-Current Liabilities */}
          <div className="mb-2">
            <p className="text-white/80 mb-1">Non-Current Liabilities:</p>
            {liabilities.nonCurrent.map((item, i) => (
              <div key={i} className="flex justify-between text-white/60 pl-4 py-0.5">
                <span>{item.label}</span>
                <span>{formatValue(item.value)}</span>
              </div>
            ))}
            <div className="flex justify-between text-white border-t border-white/10 mt-1 pt-1 pl-4">
              <span>Total Non-Current Liabilities</span>
              <span>{formatValue(totalNonCurrentLiabilities)}</span>
            </div>
          </div>

          <div className="flex justify-between text-white font-bold border-t-2 border-white/20 mt-2 pt-2">
            <span>TOTAL LIABILITIES</span>
            <span>{formatValue(totalLiabilities)}</span>
          </div>
        </div>

        {/* EQUITY */}
        <div className="pt-4 border-t border-white/20">
          <h4 className="text-white font-bold mb-2 uppercase">Shareholders' Equity</h4>
          {equity.map((item, i) => (
            <div key={i} className="flex justify-between text-white/60 pl-4 py-0.5">
              <span>{item.label}</span>
              <span>{formatValue(item.value)}</span>
            </div>
          ))}
          <div className="flex justify-between text-white font-bold border-t-2 border-white/20 mt-2 pt-2">
            <span>TOTAL EQUITY</span>
            <span>{formatValue(totalEquity)}</span>
          </div>
        </div>

        {/* TOTAL L+E */}
        <div className="flex justify-between text-white font-bold border-t-2 border-white/30 pt-2">
          <span>TOTAL LIABILITIES + EQUITY</span>
          <span>{formatValue(totalLiabilitiesAndEquity)}</span>
        </div>
      </div>
    </div>
  );
};
