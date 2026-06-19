import type { FinanceSession } from './finance-types';

const FINANCE_SESSION_KEY = 'sweep_finance_session';

export function saveFinanceSession(session: FinanceSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FINANCE_SESSION_KEY, JSON.stringify(session));
}

export function loadFinanceSession(): FinanceSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FINANCE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FinanceSession;
    if (!parsed?.report || !parsed?.metrics) return null;
    if (!parsed.analysis) {
      parsed.analysis = {
        executiveSummary: 'Analysis unavailable for this saved session. Generate a new report.',
        keyHighlights: [],
        liquidityAssessment: '',
        leverageAssessment: '',
        assetQualityNotes: '',
        strengths: [],
        riskFactors: [],
        watchItems: [],
        analystVerdict: '',
      };
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearFinanceSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FINANCE_SESSION_KEY);
}