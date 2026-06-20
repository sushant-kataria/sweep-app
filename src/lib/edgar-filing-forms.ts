/** SEC filing forms we treat as annual / quarterly financial research sources. */

export const ANNUAL_FILING_FORMS = ['10-K', '10-K/A', '20-F', '20-F/A'] as const;
export const QUARTERLY_FILING_FORMS = ['10-Q', '10-Q/A', '6-K'] as const;
export const RESEARCH_FILING_FORMS = [...ANNUAL_FILING_FORMS, ...QUARTERLY_FILING_FORMS] as const;

export type ResearchFilingForm = (typeof RESEARCH_FILING_FORMS)[number];

export type EdgarFactLike = {
  end: string;
  filed?: string;
  form?: string;
  fy?: number;
  fp?: string;
  frame?: string | null;
};

export function isAnnualFilingForm(form: string | undefined): form is (typeof ANNUAL_FILING_FORMS)[number] {
  return ANNUAL_FILING_FORMS.includes(form as (typeof ANNUAL_FILING_FORMS)[number]);
}

export function isQuarterlyFilingForm(form: string | undefined): form is (typeof QUARTERLY_FILING_FORMS)[number] {
  return QUARTERLY_FILING_FORMS.includes(form as (typeof QUARTERLY_FILING_FORMS)[number]);
}

export function isResearchFilingForm(form: string | undefined): form is ResearchFilingForm {
  return RESEARCH_FILING_FORMS.includes(form as ResearchFilingForm);
}

/** Annual period row — 10-K/20-F with FY fiscal period, excluding quarter frames. */
export function isAnnualFactEntry(entry: EdgarFactLike): boolean {
  const form = entry.form ?? '';
  if (!isAnnualFilingForm(form)) return false;
  if (entry.fp && entry.fp !== 'FY') return false;
  if (entry.frame && /Q[1-4]$/.test(entry.frame)) return false;
  return true;
}

/**
 * Quarterly period row — 10-Q/6-K, or foreign issuers (20-F) with CY####Q# frames.
 */
export function isQuarterlyFactEntry(entry: EdgarFactLike): boolean {
  const form = entry.form ?? '';
  if (isQuarterlyFilingForm(form)) {
    return !entry.fp || /^Q[1-4]$/.test(entry.fp);
  }
  if (isAnnualFilingForm(form) && entry.frame && /Q[1-4]$/.test(entry.frame)) {
    return true;
  }
  return false;
}

export function normalizeResearchFormLabel(form?: string): '10-K' | '10-Q' | '20-F' | '6-K' {
  if (form?.startsWith('20-F')) return '20-F';
  if (form?.startsWith('10-K')) return '10-K';
  if (form?.startsWith('10-Q')) return '10-Q';
  if (form === '6-K') return '6-K';
  return '10-K';
}
