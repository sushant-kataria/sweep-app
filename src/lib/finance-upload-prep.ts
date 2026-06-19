import { extractBestBalanceSheetWindow, focusBalanceSheetForUpload, MAX_STORED_CHARS } from './finance-focus';
import { tryHeuristicBalanceSheetExtraction } from './finance-heuristic-extract';

const FINANCIAL_KEYWORDS =
  /asset|liabilit|equity|cash|receivable|inventory|payable|borrow|goodwill|retained|share\s+capital|crore|million/i;

function capText(text: string, max: number) {
  if (text.length <= max) return text;
  const head = Math.floor(max * 0.55);
  const tail = max - head - 40;
  return `${text.slice(0, head)}\n\n[...content truncated...]\n\n${text.slice(-tail)}`;
}

function scoreFinancialSlice(slice: string): number {
  let score = 0;
  if (/balance\s+sheet/i.test(slice)) score += 8;
  if (/total\s+assets/i.test(slice)) score += 10;
  if (/total\s+equity\s+and\s+liabilities/i.test(slice)) score += 12;
  if (/cash\s+and\s+cash/i.test(slice)) score += 4;
  if (/statement\s+of\s+financial\s+position/i.test(slice)) score += 8;

  const lines = slice.split(/\n+/).filter((l) => l.trim().length > 3);
  const financialLines = lines.filter((l) => FINANCIAL_KEYWORDS.test(l) && /\d[\d,]{2,}/.test(l));
  score += Math.min(financialLines.length, 30);

  return score;
}

function extractByFinancialDensity(text: string, windowSize = 20_000): string | null {
  if (text.length < 800) return null;

  let best: { start: number; score: number } | null = null;
  const step = Math.max(4000, Math.floor(windowSize / 4));

  for (let start = 0; start < text.length; start += step) {
    const slice = text.slice(start, start + windowSize);
    if (slice.length < 500) break;
    const score = scoreFinancialSlice(slice);
    if (!best || score > best.score) best = { start, score };
  }

  if (!best || best.score < 14) return null;
  return text.slice(best.start, Math.min(text.length, best.start + windowSize));
}

function buildUploadCandidates(raw: string): string[] {
  const seen = new Set<string>();
  const add = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    if (!trimmed || trimmed.length < 200 || seen.has(trimmed)) return;
    seen.add(trimmed);
    candidates.push(trimmed);
  };

  const candidates: string[] = [];
  add(extractBestBalanceSheetWindow(raw, 80_000));
  add(focusBalanceSheetForUpload(raw, MAX_STORED_CHARS));
  add(extractByFinancialDensity(raw));
  add(capText(raw, MAX_STORED_CHARS));
  return candidates;
}

/** Pick the text window most likely to contain a parseable balance sheet. */
export function prepareUploadText(raw: string, fileName?: string): string {
  if (!raw.trim()) return raw;

  const candidates = buildUploadCandidates(raw);
  for (const candidate of candidates) {
    if (tryHeuristicBalanceSheetExtraction(candidate, { fileName })) {
      return candidate;
    }
  }

  return candidates[0] ?? focusBalanceSheetForUpload(raw, MAX_STORED_CHARS);
}