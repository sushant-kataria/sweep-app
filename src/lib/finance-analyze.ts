import type { BalanceSheetReport, FinanceSession } from './finance-types';
import { buildExtractionPrompt, type ExtractedDocument } from './finance-extract';
import { tryHeuristicBalanceSheetExtraction } from './finance-heuristic-extract';
import { prepareUploadText, tryHeuristicFromAllCandidates } from './finance-upload-prep';
import { computeFinanceMetrics } from './finance-metrics';
import {
  generateStructuredObject,
  hasFinanceAiConfigured,
  isFinanceRateLimitError,
} from './finance-model';
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

const HEURISTIC_FALLBACK_ERROR =
  'Could not extract a balance sheet. AI quota may be exceeded and no table was found in this file. Use a text-based PDF, Excel export, or Top 25 US.';

const HEURISTIC_ONLY_ERROR =
  'Could not find a balance-sheet table in this file. Use a text-based PDF (not scanned), an Excel export with line items, or Top 25 US for instant reports.';

function runHeuristicExtraction(
  doc: ExtractedDocument,
  options?: { isUpload?: boolean },
): BalanceSheetExtraction | null {
  if (options?.isUpload) {
    return tryHeuristicFromAllCandidates(doc.text, doc.fileName);
  }

  return (
    tryHeuristicFromAllCandidates(prepareUploadText(doc.text), doc.fileName) ??
    tryHeuristicBalanceSheetExtraction(doc.text, { fileName: doc.fileName })
  );
}

function withHeuristicFallbackNote(result: BalanceSheetExtraction): BalanceSheetExtraction {
  const note = 'Parsed from document tables (AI quota exceeded).';
  return {
    ...result,
    extractionNotes: result.extractionNotes ? `${result.extractionNotes} ${note}` : note,
  };
}

async function extractBalanceSheet(
  doc: ExtractedDocument,
  options?: { heuristicOnly?: boolean; isUpload?: boolean },
): Promise<BalanceSheetExtraction> {
  const heuristic = () => runHeuristicExtraction(doc, options);

  if (options?.heuristicOnly) {
    const parsed = heuristic();
    if (parsed) return parsed;
    throw new Error(HEURISTIC_ONLY_ERROR);
  }

  if (!hasFinanceAiConfigured()) {
    const parsed = heuristic();
    if (parsed) return parsed;
    throw new Error(HEURISTIC_ONLY_ERROR);
  }

  try {
    return await generateStructuredObject({
      schema: balanceSheetExtractionSchema,
      system: EXTRACTION_SYSTEM,
      prompt: buildExtractionPrompt(doc),
    });
  } catch (e) {
    const parsed = heuristic();
    if (parsed) {
      return withHeuristicFallbackNote(parsed);
    }

    if (isFinanceRateLimitError(e)) {
      throw new Error(HEURISTIC_FALLBACK_ERROR);
    }

    throw e instanceof Error ? e : new Error(String(e));
  }
}

export async function analyzeDocument(
  doc: ExtractedDocument,
  meta: { dataSource: BalanceSheetReport['dataSource']; sourceUrl?: string; sourceFileName?: string },
  options?: { heuristicOnly?: boolean },
): Promise<FinanceSession> {
  const isUpload =
    meta.dataSource === 'pdf' || meta.dataSource === 'excel' || meta.dataSource === 'csv';
  const preparedDoc = isUpload ? { ...doc, text: prepareUploadText(doc.text) } : doc;
  const extracted = await extractBalanceSheet(preparedDoc, {
    ...options,
    isUpload,
  });

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