import type { BalanceSheetReport, FinanceAnalysis, FinanceMetrics } from './finance-types';

function fmtM(v: number) {
  return `$${v.toLocaleString('en-US')}M`;
}

function fmtR(v: number | null) {
  if (v == null || !Number.isFinite(v)) return 'N/A';
  return v.toFixed(2);
}

export function buildTemplateAnalysis(report: BalanceSheetReport, metrics: FinanceMetrics): FinanceAnalysis {
  const { companyName, ticker, period } = report;
  const liquid =
    metrics.currentRatio != null && metrics.currentRatio >= 1.5
      ? 'strong'
      : metrics.currentRatio != null && metrics.currentRatio >= 1
        ? 'adequate'
        : 'tight';

  const leverage =
    metrics.debtToEquity != null && metrics.debtToEquity > 1.5
      ? 'elevated'
      : metrics.debtToEquity != null && metrics.debtToEquity > 0.8
        ? 'moderate'
        : 'conservative';

  return {
    executiveSummary: `${companyName} (${ticker}) reports total assets of ${fmtM(metrics.totalAssets)} and total liabilities of ${fmtM(metrics.totalLiabilities)} for ${period}. Total equity stands at ${fmtM(metrics.totalEquity)} with working capital of ${fmtM(metrics.workingCapital)}. The current ratio of ${fmtR(metrics.currentRatio)} indicates ${liquid} short-term liquidity, while debt-to-equity of ${fmtR(metrics.debtToEquity)} reflects a ${leverage} capital structure.`,
    keyHighlights: [
      `Total assets: ${fmtM(metrics.totalAssets)} | Total liabilities: ${fmtM(metrics.totalLiabilities)}`,
      `Cash & equivalents: ${fmtM(metrics.cashAndEquivalents)} | Working capital: ${fmtM(metrics.workingCapital)}`,
      `Current ratio: ${fmtR(metrics.currentRatio)} | Quick ratio: ${fmtR(metrics.quickRatio)}`,
      `Total debt: ${fmtM(metrics.totalDebt)} | Net debt: ${fmtM(metrics.netDebt)}`,
      `Debt/equity: ${fmtR(metrics.debtToEquity)} | Equity ratio: ${fmtR(metrics.equityRatio)}`,
    ],
    liquidityAssessment: `Current assets of ${fmtM(metrics.currentAssets)} cover ${fmtR(metrics.currentRatio)}x current liabilities of ${fmtM(metrics.currentLiabilities)}. Cash and equivalents total ${fmtM(metrics.cashAndEquivalents)} (${fmtR(metrics.cashRatio)}x cash ratio). Working capital is ${fmtM(metrics.workingCapital)}. Overall liquidity appears ${liquid} for near-term obligations.`,
    leverageAssessment: `Total debt is ${fmtM(metrics.totalDebt)} against equity of ${fmtM(metrics.totalEquity)}, yielding debt/equity of ${fmtR(metrics.debtToEquity)} and debt/assets of ${fmtR(metrics.debtToAssets)}. Net debt of ${fmtM(metrics.netDebt)} ${metrics.netDebt < 0 ? 'indicates a net cash position' : 'reflects gross debt net of cash'}. Leverage is ${leverage} relative to typical large-cap peers.`,
    assetQualityNotes: `Non-current assets of ${fmtM(metrics.nonCurrentAssets)} represent ${((metrics.nonCurrentAssets / metrics.totalAssets) * 100).toFixed(0)}% of the asset base. Current assets are ${fmtM(metrics.currentAssets)} with cash at ${fmtM(metrics.cashAndEquivalents)}. Review line-item detail for inventory intensity, intangibles, and PP&E concentration in the balance sheet tab.`,
    strengths: [
      metrics.balanceCheckOk
        ? 'Balance sheet balances (assets = liabilities + equity).'
        : `Balance sheet has a ${fmtM(metrics.balanceCheck)} reconciliation gap — verify source filing.`,
      metrics.currentRatio != null && metrics.currentRatio >= 1
        ? `Current ratio above 1.0 (${fmtR(metrics.currentRatio)}) supports near-term obligations.`
        : `Equity base of ${fmtM(metrics.totalEquity)} anchors the capital structure.`,
      metrics.cashAndEquivalents > metrics.totalDebt * 0.3
        ? `Meaningful cash reserves (${fmtM(metrics.cashAndEquivalents)}) provide financial flexibility.`
        : `Asset scale of ${fmtM(metrics.totalAssets)} reflects established market position.`,
    ],
    riskFactors: [
      metrics.debtToEquity != null && metrics.debtToEquity > 1
        ? `Elevated leverage (debt/equity ${fmtR(metrics.debtToEquity)}) increases sensitivity to rates and earnings shocks.`
        : `Macro slowdown could pressure receivables and working capital.`,
      metrics.currentRatio != null && metrics.currentRatio < 1
        ? `Current ratio below 1.0 (${fmtR(metrics.currentRatio)}) warrants monitoring of short-term funding.`
        : `Non-current liabilities of ${fmtM(metrics.nonCurrentLiabilities)} require long-run cash flow coverage.`,
      `Figures sourced from ${report.source} — cross-check against the full 10-Q/10-K before decisions.`,
    ],
    watchItems: [
      `Track debt maturities and ${metrics.netDebt >= 0 ? 'net debt' : 'cash'} trajectory next quarter.`,
      `Monitor changes in current ratio (${fmtR(metrics.currentRatio)}) and working capital.`,
      `Compare ${period} figures to prior quarter when new filings are released.`,
    ],
    analystVerdict: `${companyName} presents a ${liquid}-liquidity, ${leverage}-leverage balance sheet as of ${period}. With ${fmtM(metrics.totalAssets)} in assets and ${fmtR(metrics.equityRatio)} equity ratio, the structure ${metrics.debtToEquity != null && metrics.debtToEquity < 1 ? 'leans equity-funded' : 'carries meaningful debt'}. Investors should weigh cash generation against leverage and working-capital trends. Educational analysis only — not investment advice.`,
  };
}