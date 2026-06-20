import type { BalanceSheetReport, FinanceMetrics } from './finance-types';

function sum(items: Array<{ value: number }>) {
  return items.reduce((acc, item) => acc + item.value, 0);
}

function findCash(assets: BalanceSheetReport['assets']): number {
  const all = [...assets.current, ...assets.nonCurrent];
  const cashLabels = /cash|equivalent|marketable security|short-term investment/i;
  return all.filter((i) => cashLabels.test(i.label)).reduce((a, i) => a + i.value, 0);
}

function findDebt(report: BalanceSheetReport): number {
  const all = [
    ...report.liabilities.current,
    ...report.liabilities.nonCurrent,
  ];
  const debtLabels = /debt|borrow|commercial paper|note payable|bond/i;
  return all.filter((i) => debtLabels.test(i.label)).reduce((a, i) => a + i.value, 0);
}

function findQuickAssets(assets: BalanceSheetReport['assets']): number {
  const exclude = /inventor|prepaid|deferred tax asset/i;
  return assets.current.filter((i) => !exclude.test(i.label)).reduce((a, i) => a + i.value, 0);
}

export function computeFinanceMetrics(report: BalanceSheetReport): FinanceMetrics {
  const currentAssets = sum(report.assets.current);
  const nonCurrentAssets = sum(report.assets.nonCurrent);
  const currentLiabilities = sum(report.liabilities.current);
  const nonCurrentLiabilities = sum(report.liabilities.nonCurrent);
  const auth = report.authoritativeTotals;

  const totalAssets = auth?.totalAssets ?? currentAssets + nonCurrentAssets;
  const totalLiabilities = auth?.totalLiabilities ?? currentLiabilities + nonCurrentLiabilities;
  const totalEquity = auth?.totalEquity ?? sum(report.equity);
  const cashAndEquivalents = findCash(report.assets);
  const totalDebt = findDebt(report);
  const quickAssets = findQuickAssets(report.assets);
  const balanceCheck = totalAssets - (totalLiabilities + totalEquity);

  return {
    totalAssets,
    totalLiabilities,
    totalEquity,
    currentAssets,
    currentLiabilities,
    nonCurrentAssets,
    nonCurrentLiabilities,
    cashAndEquivalents,
    totalDebt,
    netDebt: totalDebt - cashAndEquivalents,
    currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : null,
    quickRatio: currentLiabilities > 0 ? quickAssets / currentLiabilities : null,
    cashRatio: currentLiabilities > 0 ? cashAndEquivalents / currentLiabilities : null,
    debtToEquity: totalEquity > 0 ? totalLiabilities / totalEquity : null,
    debtToAssets: totalAssets > 0 ? totalLiabilities / totalAssets : null,
    equityRatio: totalAssets > 0 ? totalEquity / totalAssets : null,
    workingCapital: currentAssets - currentLiabilities,
    balanceCheck,
    balanceCheckOk: Math.abs(balanceCheck) < Math.max(totalAssets * 0.01, 1),
  };
}