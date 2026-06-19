/** Max chars stored after extraction from uploads */
export const MAX_STORED_CHARS = 60_000;

const HIGH_CONFIDENCE_MARKERS = [
  /consolidated\s+balance\s+sheet[\s\S]{0,120}?as\s+at/gi,
  /as\s+at\s+\d{1,2}\s*(?:st|nd|rd|th)?\s+\w+,?\s+\d{4}[\s\S]{0,200}?assets\s+non[- ]current/gi,
  /balance\s+sheet\s+as\s+at/gi,
  /condensed\s+consolidated\s+balance\s+sheets?/gi,
  /statements?\s+of\s+financial\s+position/gi,
  /(?:consolidated\s+)?balance\s+sheets?/gi,
];

const WINDOW_CHARS = 25_000;
const BALANCE_SHEET_LOOKBACK = 30_000;

function capText(text: string, max: number) {
  if (text.length <= max) return text;
  const head = Math.floor(max * 0.55);
  const tail = max - head - 40;
  return `${text.slice(0, head)}\n\n[...content truncated...]\n\n${text.slice(-tail)}`;
}

function numericDensity(slice: string): number {
  const lines = slice.split(/\n+/).filter((l) => l.trim().length > 3);
  if (lines.length === 0) return 0;
  const withNumbers = lines.filter((l) => /\d[\d,]{2,}/.test(l)).length;
  return withNumbers / lines.length;
}

/** Isolate the balance-sheet table from long annual reports before truncation. */
export function extractBestBalanceSheetWindow(text: string, maxWindow = 50_000): string | null {
  const candidates: Array<{ start: number; end: number; score: number }> = [];

  const endRe = /total\s+equity\s+and\s+liabilities\s+[\d,()₹$€£\s]+[\d,()₹$€£]+/gi;
  let match: RegExpExecArray | null;
  while ((match = endRe.exec(text)) !== null) {
    const end = match.index + match[0].length;
    const startSearch = Math.max(0, match.index - BALANCE_SHEET_LOOKBACK);
    const slice = text.slice(startSearch, end);
    const startMarkers = [
      /assets\s+non[- ]current/i,
      /non[- ]current\s+assets/i,
      /balance\s+sheet/i,
      /equity\s+and\s+liabilities/i,
    ];
    let start = 0;
    for (const marker of startMarkers) {
      const idx = slice.search(marker);
      if (idx >= 0) {
        start = idx;
        break;
      }
    }
    const block = slice.slice(start);
    const numericHits = (block.match(/\d[\d,]{2,}/g) ?? []).length;
    const hasTotals = /\btotal\s+assets\b/i.test(block) ? 5 : 0;
    const score = numericHits + hasTotals;
    if (score >= 12) candidates.push({ start: startSearch + start, end, score });
  }

  for (const marker of HIGH_CONFIDENCE_MARKERS) {
    marker.lastIndex = 0;
    while ((match = marker.exec(text)) !== null) {
      const start = Math.max(0, match.index);
      const end = Math.min(text.length, start + WINDOW_CHARS);
      const slice = text.slice(start, end);
      const score =
        numericDensity(slice) * 20 +
        (/\btotal\s+assets\b/i.test(slice) ? 8 : 0) +
        (/\btotal\s+equity\s+and\s+liabilities\b/i.test(slice) ? 10 : 0);
      if (score >= 8) candidates.push({ start, end, score });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score || b.end - a.end);
  const best = candidates[0];
  return text.slice(best.start, Math.min(best.end + 400, best.start + maxWindow));
}

/** Cap upload text while preserving the balance-sheet section from long PDFs. */
export function focusBalanceSheetForUpload(text: string, maxChars = MAX_STORED_CHARS): string {
  const window = extractBestBalanceSheetWindow(text);
  if (window && window.length >= 600) return capText(window, maxChars);
  return capText(text, maxChars);
}