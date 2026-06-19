import type { BalanceSheetReport, FinanceSession } from './finance-types';
import { buildExtractionPrompt, type ExtractedDocument } from './finance-extract';
import { tryHeuristicBalanceSheetExtraction } from './finance-heuristic-extract';
import { prepareUploadText } from './finance-upload-prep';
import { computeFinanceMetrics } from './finance-metrics';
import { generateStructuredObject } from './finance-model';
import { balanceSheetExtractionSchema, type BalanceSheetExtraction } from './finance-schemas';
import { buildTemplateAnalysis } from './finance-template-analysis';

const EXTRACTION_SYSTEM = `You are a senior financial data engineer at a top investment bank.
Extract a structured balance sheet from the provided annual report, 10-K, investor presentation, or spreadsheet.

RULES:
- Use exact line item labels from the source when possible.
- Values must be numeric (no commas, no currency symbols). Use the filing's stated units (typically millions).
- Classify items into current vs non-current assets and liabilities using GAAP/IFRS conventions.
- Include all material equity components (common stock, retained earnings, AOCI, treasury stock, etc.).
- If ticker is unknown, use a short uppercase code derived from company name.
- Never invent line items not supported by the document.
- Set extractionConfidence to low if data is incomplete or ambiguous.
- If multiple periods appear, use the most recent fiscal year-end.`;

const HEURISTIC_ONLY_ERROR =
  'Could not find a balance-sheet table in this file. Use a text-based PDF (not scanned), an Excel export with line items, or Top 25 US for instant reports.';

async function extractBalanceSheet(
  doc: ExtractedDocument,
  options?: { heuristicOnly?: boolean },
): Promise<BalanceSheetExtraction> {
  const heuristic = tryHeuristicBalanceSheetExtraction(doc.text, { fileName: doc.fileName });
  if (heuristic) return heuristic;

  if (options?.heuristicOnly) {
    throw new Error(HEURISTIC_ONLY_ERROR);
  }

  const ai = await generateStructuredObject({
    schema: balanceSheetExtractionSchema,
    system: EXTRACTION_SYSTEM,
    prompt: buildExtractionPrompt(doc),
  });
  return ai;
}

export async function analyzeDocument(
  doc: ExtractedDocument,
  meta: { dataSource: BalanceSheetReport['dataSource']; sourceUrl?: string; sourceFileName?: string },
  options?: { heuristicOnly?: boolean },
): Promise<FinanceSession> {
  const isUpload =
    meta.dataSource === 'pdf' || meta.dataSource === 'excel' || meta.dataSource === 'csv';
  const preparedDoc = isUpload
    ? { ...doc, text: prepareUploadText(doc.text, doc.fileName) }
    : doc;
  const extracted = await extractBalanceSheet(preparedDoc, options);

  const report: BalanceSheetReport = {
    type: 'balance_sheet',
    ticker: extracted.ticker.toUpperCase().slice(0, 12) || 'CUSTOM',
    companyName: extracted.companyName,
    period: extracted.period,
    currency: extracted.currency || 'USD',
    title: extracted.title || `${extracted.companyName} Balance Sheet`,
    assets: extracted.assets,
    liabilities: extracted.liabilities,
    equity: extracted.equity,
    source: meta.sourceUrl
      ? `Imported from ${meta.sourceUrl}`
      : meta.sourceFileName
        ? `Imported from ${meta.sourceFileName}`
        : 'Imported document',
    dataSource: meta.dataSource,
    sourceUrl: meta.sourceUrl,
    sourceFileName: meta.sourceFileName,
  };

  const metrics = computeFinanceMetrics(report);

  const analysis = buildTemplateAnalysis(report, metrics);

  return {
    report,
    metrics,
    analysis,
    generatedAt: Date.now(),
  };
}