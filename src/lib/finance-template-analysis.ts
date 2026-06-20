import type { BalanceSheetReport, FinanceAnalysis, FinanceMetrics } from './finance-types';

function fmtM(v: number) {
  const sign = v < 0 ? '-' : '';
  return `${sign}$${Math.abs(v).toLocaleString('en-US')}M`;
}

function fmtR(v: number | null) {
  if (v == null || !Number.isFinite(v)) return 'N/A';
  return v.toFixed(2);
}

function leverageLabel(metrics: FinanceMetrics): 'elevated' | 'moderate' | 'conservative' {
  if (metrics.totalEquity <= 0) {
    if (metrics.debtToAssets != null && metrics.debtToAssets > 0.8) return 'elevated';
    if (metrics.debtToAssets != null && metrics.debtToAssets > 0.5) return 'moderate';
    return 'conservative';
  }
  if (metrics.debtToEquity != null && metrics.debtToEquity > 1.5) return 'elevated';
  if (metrics.debtToEquity != null && metrics.debtToEquity > 0.8) return 'moderate';
  return 'conservative';
}

function leverageSummary(metrics: FinanceMetrics): string {
  if (metrics.totalEquity <= 0) {
    return `debt-to-assets of ${fmtR(metrics.debtToAssets)} reflects capital structure (debt/equity is not meaningful with negative book equity)`;
  }
  return `debt-to-equity of ${fmtR(metrics.debtToEquity)} reflects a ${leverageLabel(metrics)} capital structure`;
}

export function buildTemplateAnalysis(report: BalanceSheetReport, metrics: FinanceMetrics): FinanceAnalysis {
  const { companyName, ticker, period } = report;
  const liquid =
    metrics.currentRatio != null && metrics.currentRatio >= 1.5
      ? 'strong'
      : metrics.currentRatio != null && metrics.currentRatio >= 1
        ? 'adequate'
        : 'tight';

  const leverage = leverageLabel(metrics);
  const negativeEquityNote =
    metrics.totalEquity <= 0
      ? ' Negative book equity often reflects buybacks or legacy capital structure rather than operational distress alone.'
      : '';

  return {
    executiveSummary: `${companyName} (${ticker}) reports total assets of ${fmtM(metrics.totalAssets)} and total liabilities of ${fmtM(metrics.totalLiabilities)} for ${period}. Total equity stands at ${fmtM(metrics.totalEquity)} with working capital of ${fmtM(metrics.workingCapital)}.${negativeEquityNote} The current ratio of ${fmtR(metrics.currentRatio)} indicates ${liquid} short-term liquidity, while ${leverageSummary(metrics)}.`,
    keyHighlights: [
      `Total assets: ${fmtM(metrics.totalAssets)} | Total liabilities: ${fmtM(metrics.totalLiabilities)}`,
      `Cash & equivalents: ${fmtM(metrics.cashAndEquivalents)} | Working capital: ${fmtM(metrics.workingCapital)}`,
      `Current ratio: ${fmtR(metrics.currentRatio)} | Quick ratio: ${fmtR(metrics.quickRatio)}`,
      `Total debt: ${fmtM(metrics.totalDebt)} | Net debt: ${fmtM(metrics.netDebt)}`,
      metrics.totalEquity > 0
        ? `Debt/equity: ${fmtR(metrics.debtToEquity)} | Equity ratio: ${fmtR(metrics.equityRatio)}`
        : `Debt/assets: ${fmtR(metrics.debtToAssets)} | Equity ratio: ${fmtR(metrics.equityRatio)} (negative book equity)`,
    ],
    liquidityAssessment: `Current assets of ${fmtM(metrics.currentAssets)} cover ${fmtR(metrics.currentRatio)}x current liabilities of ${fmtM(metrics.currentLiabilities)}. Cash and equivalents total ${fmtM(metrics.cashAndEquivalents)} (${fmtR(metrics.cashRatio)}x cash ratio). Working capital is ${fmtM(metrics.workingCapital)}. Overall liquidity appears ${liquid} for near-term obligations.`,
    leverageAssessment:
      metrics.totalEquity > 0
        ? `Total debt is ${fmtM(metrics.totalDebt)} against equity of ${fmtM(metrics.totalEquity)}, yielding debt/equity of ${fmtR(metrics.debtToEquity)} and debt/assets of ${fmtR(metrics.debtToAssets)}. Net debt of ${fmtM(metrics.netDebt)} ${metrics.netDebt < 0 ? 'indicates a net cash position' : 'reflects gross debt net of cash'}. Leverage is ${leverage} relative to typical large-cap peers.`
        : `Total debt is ${fmtM(metrics.totalDebt)} while reported stockholders' equity is ${fmtM(metrics.totalEquity)} — debt/equity is not meaningful here. Debt/assets of ${fmtR(metrics.debtToAssets)} and net debt of ${fmtM(metrics.netDebt)} are more informative. Negative book equity is common after large buybacks or legacy LBO structures.`,
    assetQualityNotes: `Non-current assets of ${fmtM(metrics.nonCurrentAssets)} represent ${((metrics.nonCurrentAssets / metrics.totalAssets) * 100).toFixed(0)}% of the asset base. Current assets are ${fmtM(metrics.currentAssets)} with cash at ${fmtM(metrics.cashAndEquivalents)}. Review line-item detail for inventory intensity, intangibles, and PP&E concentration in the balance sheet tab.`,
    strengths: [
      metrics.balanceCheckOk
        ? 'Balance sheet balances (assets = liabilities + equity).'
        : `Balance sheet has a ${fmtM(metrics.balanceCheck)} reconciliation gap — verify source filing.`,
      metrics.currentRatio != null && metrics.currentRatio >= 1
        ? `Current ratio above 1.0 (${fmtR(metrics.currentRatio)}) supports near-term obligations.`
        : metrics.totalEquity > 0
          ? `Equity base of ${fmtM(metrics.totalEquity)} anchors the capital structure.`
          : `Operations can remain healthy despite negative book equity (${fmtM(metrics.totalEquity)}).`,
      metrics.cashAndEquivalents > metrics.totalDebt * 0.3
        ? `Meaningful cash reserves (${fmtM(metrics.cashAndEquivalents)}) provide financial flexibility.`
        : `Asset scale of ${fmtM(metrics.totalAssets)} reflects established market position.`,
    ],
    riskFactors: [
      metrics.totalEquity > 0 && metrics.debtToEquity != null && metrics.debtToEquity > 1
        ? `Elevated leverage (debt/equity ${fmtR(metrics.debtToEquity)}) increases sensitivity to rates and earnings shocks.`
        : metrics.debtToAssets != null && metrics.debtToAssets > 0.8
          ? `High liabilities relative to assets (debt/assets ${fmtR(metrics.debtToAssets)}) warrants leverage monitoring.`
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
    analystVerdict:
      metrics.totalEquity > 0
        ? `${companyName} presents a ${liquid}-liquidity, ${leverage}-leverage balance sheet as of ${period}. With ${fmtM(metrics.totalAssets)} in assets and ${fmtR(metrics.equityRatio)} equity ratio, the structure ${metrics.debtToEquity != null && metrics.debtToEquity < 1 ? 'leans equity-funded' : 'carries meaningful debt'}. Investors should weigh cash generation against leverage and working-capital trends. Educational analysis only — not investment advice.`
        : `${companyName} presents a ${liquid}-liquidity balance sheet as of ${period} with negative book equity (${fmtM(metrics.totalEquity)}). Focus on cash flow, debt service, and debt/assets (${fmtR(metrics.debtToAssets)}) rather than debt/equity. Educational analysis only — not investment advice.`,
  };
}
