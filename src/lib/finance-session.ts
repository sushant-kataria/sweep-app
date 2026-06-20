import { getBalanceSheetReport } from './finance-data';
import { fetchEdgarBalanceSheetReport } from './finance-edgar';
import { getCachedFinanceSession, REPORT_PARSER_VERSION, setCachedFinanceSession } from './finance-report-cache';
import { computeFinanceMetrics } from './finance-metrics';
import { buildTemplateAnalysis } from './finance-template-analysis';
import type { FinanceSession } from './finance-types';

export function buildFinanceSessionFromReport(report: FinanceSession['report']): FinanceSession {
  const metrics = computeFinanceMetrics(report);
  const analysis = buildTemplateAnalysis(report, metrics);
  return {
    report,
    metrics,
    analysis,
    generatedAt: Date.now(),
    parserVersion: report.dataSource === 'edgar' ? REPORT_PARSER_VERSION : undefined,
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