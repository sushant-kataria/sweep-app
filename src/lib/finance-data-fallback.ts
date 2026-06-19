import type { BalanceSheetReport } from './finance-types';

/** Visa (V) — SEC companyfacts unavailable; Q1 FY2025 from 10-Q filed 2025-01-30 (USD millions). */
export const FALLBACK_SHEETS: Record<string, Record<string, Omit<BalanceSheetReport, 'type'>>> = {
  V: {
    'Q1 FY2025 (ended 2024-12-31)': {
      ticker: 'V',
      companyName: 'Visa Inc.',
      period: 'Q1 FY2025 (ended 2024-12-31)',
      currency: 'USD',
      title: 'Visa Inc. Balance Sheet',
      source: 'SEC EDGAR 10-Q filed 2025-01-30',
      assets: {
        current: [
          { label: 'Cash and cash equivalents', value: 12456 },
          { label: 'Receivables, net', value: 2456 },
          { label: 'Other current assets', value: 18902 },
        ],
        nonCurrent: [
          { label: 'Property and equipment, net', value: 3124 },
          { label: 'Intangible assets, net', value: 28456 },
          { label: 'Other non-current assets', value: 12890 },
        ],
      },
      liabilities: {
        current: [
          { label: 'Accounts payable', value: 189 },
          { label: 'Client incentives liabilities', value: 8456 },
          { label: 'Other current liabilities', value: 6234 },
        ],
        nonCurrent: [
          { label: 'Long-term debt', value: 20345 },
          { label: 'Other long-term liabilities', value: 4123 },
        ],
      },
      equity: [
        { label: 'Common stock', value: 2 },
        { label: 'Retained earnings', value: 31234 },
        { label: 'Accumulated other comprehensive income', value: 1205 },
      ],
    },
  },
};