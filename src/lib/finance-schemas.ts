import { z } from 'zod';

const lineItemSchema = z.object({
  label: z.string().describe('Exact line item label from the filing'),
  value: z.number().describe('Numeric value in millions unless filing states otherwise'),
});

const sectionSchema = z.object({
  current: z.array(lineItemSchema).describe('Current portion line items'),
  nonCurrent: z.array(lineItemSchema).describe('Non-current / long-term line items'),
});

export const balanceSheetExtractionSchema = z.object({
  ticker: z.string().describe('Ticker symbol or short identifier, e.g. WMT or CUSTOM'),
  companyName: z.string(),
  period: z.string().describe('Fiscal period, e.g. FY 2024 or Q4 2024'),
  currency: z.string().default('USD'),
  title: z.string(),
  assets: sectionSchema,
  liabilities: sectionSchema,
  equity: z.array(lineItemSchema),
  unitsNote: z.string().optional().describe('How values are denominated, e.g. USD millions'),
  extractionConfidence: z.enum(['high', 'medium', 'low']),
  extractionNotes: z.string().optional(),
});

export const financeAnalysisSchema = z.object({
  executiveSummary: z.string().describe('3-5 sentence institutional-grade overview'),
  keyHighlights: z.array(z.string()).min(2).max(6),
  liquidityAssessment: z.string().describe('Current ratio, working capital, cash position analysis'),
  leverageAssessment: z.string().describe('Debt structure, solvency, leverage trends'),
  assetQualityNotes: z.string().describe('Asset composition, inventory/receivables, intangibles'),
  strengths: z.array(z.string()).min(1).max(5),
  riskFactors: z.array(z.string()).min(1).max(5),
  watchItems: z.array(z.string()).min(1).max(4),
  analystVerdict: z.string().describe('One paragraph balanced conclusion for investors/analysts'),
});

export function normalizeAnalysis(raw: Record<string, unknown>) {
  const arr = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  const str = (v: unknown) => String(v ?? '').trim();
  return {
    executiveSummary: str(raw.executiveSummary),
    keyHighlights: arr(raw.keyHighlights),
    liquidityAssessment: str(raw.liquidityAssessment),
    leverageAssessment: str(raw.leverageAssessment),
    assetQualityNotes: str(raw.assetQualityNotes),
    strengths: arr(raw.strengths),
    riskFactors: arr(raw.riskFactors),
    watchItems: arr(raw.watchItems),
    analystVerdict: str(raw.analystVerdict),
  };
}

export type BalanceSheetExtraction = z.infer<typeof balanceSheetExtractionSchema>;
export type FinanceAnalysisExtraction = z.infer<typeof financeAnalysisSchema>;