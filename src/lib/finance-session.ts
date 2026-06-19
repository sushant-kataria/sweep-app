import { getBalanceSheetReport } from './finance-data';
import { computeFinanceMetrics } from './finance-metrics';
import { buildTemplateAnalysis } from './finance-template-analysis';
import type { FinanceSession } from './finance-types';

export function buildPreloadedFinanceSession(ticker: string, period?: string): FinanceSession | null {
  const report = getBalanceSheetReport(ticker, period);
  if (!report) return null;

  const enriched = { ...report, dataSource: 'demo' as const };
  const metrics = computeFinanceMetrics(enriched);
  const analysis = buildTemplateAnalysis(enriched, metrics);

  return {
    report: enriched,
    metrics,
    analysis,
    generatedAt: Date.now(),
  };
}