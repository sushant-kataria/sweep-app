import { getBalanceSheetReport } from './finance-data';
import { fetchEdgarBalanceSheetReport } from './finance-edgar';
import { getCachedFinanceSession, setCachedFinanceSession } from './finance-report-cache';
import { computeFinanceMetrics } from './finance-metrics';
import { buildTemplateAnalysis } from './finance-template-analysis';
import type { FinanceSession } from './finance-types';

export function buildFinanceSessionFromReport(
  report: FinanceSession['report'],
  dataSource: FinanceSession['report']['dataSource'] = 'demo',
): FinanceSession {
  const enriched = { ...report, dataSource: dataSource ?? report.dataSource };
  const metrics = computeFinanceMetrics(enriched);
  const analysis = buildTemplateAnalysis(enriched, metrics);
  return {
    report: enriched,
    metrics,
    analysis,
    generatedAt: Date.now(),
  };
}

export function buildPreloadedFinanceSession(ticker: string, period?: string): FinanceSession | null {
  const report = getBalanceSheetReport(ticker, period);
  if (!report) return null;
  return buildFinanceSessionFromReport({ ...report, dataSource: 'demo' });
}

export async function buildEdgarFinanceSession(meta: {
  cik: string;
  ticker: string;
  companyName: string;
}): Promise<FinanceSession> {
  const cached = await getCachedFinanceSession(meta.cik);
  if (cached) return cached;

  const report = await fetchEdgarBalanceSheetReport(meta);
  const session = buildFinanceSessionFromReport({ ...report, dataSource: 'edgar' });
  await setCachedFinanceSession(meta.cik, meta.ticker, report.period, session);
  return session;
}