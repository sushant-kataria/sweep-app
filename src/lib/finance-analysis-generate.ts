import type { BalanceSheetReport, FinanceAnalysis, FinanceMetrics } from './finance-types';
import { generateFinanceText } from './finance-model';

const ANALYSIS_SYSTEM = `You are a world-class equity research analyst writing for institutional investors.
Produce rigorous, balanced balance sheet analysis. Plain text only — no markdown bold/italic. Not investment advice.
Be specific, quantitative, and cite dollar figures and ratios from the data.`;

function parseSection(text: string, header: string): string {
  const re = new RegExp(`${header}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, 'i');
  const match = text.match(re);
  return match?.[1]?.trim() ?? '';
}

function parseBullets(block: string): string[] {
  return block
    .split('\n')
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

function parseAnalysisText(text: string): FinanceAnalysis {
  const executiveSummary = parseSection(text, 'EXECUTIVE_SUMMARY');
  const keyHighlights = parseBullets(parseSection(text, 'KEY_HIGHLIGHTS'));
  const liquidityAssessment = parseSection(text, 'LIQUIDITY');
  const leverageAssessment = parseSection(text, 'LEVERAGE');
  const assetQualityNotes = parseSection(text, 'ASSET_QUALITY');
  const strengths = parseBullets(parseSection(text, 'STRENGTHS'));
  const riskFactors = parseBullets(parseSection(text, 'RISKS'));
  const watchItems = parseBullets(parseSection(text, 'WATCH_ITEMS'));
  const analystVerdict = parseSection(text, 'VERDICT');

  return {
    executiveSummary: executiveSummary || 'Analysis generated — see sections below.',
    keyHighlights: keyHighlights.length ? keyHighlights : ['See liquidity and leverage sections for detail.'],
    liquidityAssessment: liquidityAssessment || 'Liquidity data available in metrics panel.',
    leverageAssessment: leverageAssessment || 'Leverage data available in metrics panel.',
    assetQualityNotes: assetQualityNotes || 'Review balance sheet line items for composition.',
    strengths: strengths.length ? strengths : ['Review the balance sheet for company-specific strengths.'],
    riskFactors: riskFactors.length ? riskFactors : ['Review leverage and liquidity metrics for risks.'],
    watchItems: watchItems.length ? watchItems : ['Monitor debt maturities and working capital trends.'],
    analystVerdict: analystVerdict || executiveSummary,
  };
}

export async function generateFinanceAnalysis(
  report: BalanceSheetReport,
  metrics: FinanceMetrics,
  extra?: { extractionConfidence?: string; extractionNotes?: string },
): Promise<FinanceAnalysis> {
  const text = await generateFinanceText({
    system: ANALYSIS_SYSTEM,
    prompt: `Write an institutional-grade balance sheet analysis for ${report.companyName} (${report.ticker}), period ${report.period}.

Use EXACTLY these section headers (keep headers as-is):

EXECUTIVE_SUMMARY:
(3-5 sentences with key figures)

KEY_HIGHLIGHTS:
- (4-6 bullet points with numbers)

LIQUIDITY:
(paragraph on current ratio ${metrics.currentRatio?.toFixed(2) ?? 'n/a'}, working capital $${metrics.workingCapital}M, cash $${metrics.cashAndEquivalents}M)

LEVERAGE:
(paragraph on debt $${metrics.totalDebt}M, net debt $${metrics.netDebt}M, debt/equity ${metrics.debtToEquity?.toFixed(2) ?? 'n/a'})

ASSET_QUALITY:
(paragraph on asset mix, inventories, intangibles, PP&E)

STRENGTHS:
- (2-4 bullets)

RISKS:
- (2-4 bullets)

WATCH_ITEMS:
- (2-3 bullets for investors to monitor)

VERDICT:
(one balanced paragraph conclusion)

${extra?.extractionConfidence ? `Data confidence: ${extra.extractionConfidence}` : ''}
${extra?.extractionNotes ? `Notes: ${extra.extractionNotes}` : ''}

BALANCE SHEET DATA:
${JSON.stringify(report)}

METRICS:
${JSON.stringify(metrics)}`,
  });

  return parseAnalysisText(text);
}