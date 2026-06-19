import type { BalanceSheetExtraction } from './finance-schemas';

type ParsedLine = { label: string; value: number };

const SKIP_LABEL =
  /^(assets|liabilities|equity|current|non[- ]current|total|as at|march|december|january|fy|in crore|usd|millions?|thousands?|\(|\)|annexure)/i;

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[,\s₹$€£]/g, '').replace(/^\((.+)\)$/, '-$1');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const KNOWN_LINE_ITEMS = [
  'Property, Plant and Equipment',
  'Other Intangible Assets Under Development',
  'Other Intangible Assets',
  'Capital Work-in-Progress',
  'Other Non-Current Assets',
  'Other Current Assets',
  'Cash and Cash Equivalents',
  'Other Bank Balances',
  'Equity Share Capital',
  'Non-Controlling Interest',
  'Deferred Tax Liabilities (Net)',
  'Deferred Tax Assets (Net)',
  'Financial Assets Investments',
  'Other Financial Assets',
  'Trade Receivables',
  'Trade Payables',
  'Lease Liabilities',
  'Other Equity',
  'Inventories',
  'Borrowings',
  'Goodwill',
  'Provisions',
  'Spectrum',
];

const VALUE_PAIR_RE = /^(.+?)\s+([\d,()]+(?:\.\d+)?)(?:\s+[\d,()]+(?:\.\d+)?)?$/;

function normalizeLabel(raw: string): string {
  for (const known of KNOWN_LINE_ITEMS) {
    if (raw.includes(known)) return known;
  }
  return raw
    .replace(/^.*?(?:Non-Current Assets|Current Assets|Financial Liabilities|Equity and Liabilities Equity|Equity)\s+/i, '')
    .trim();
}

function parseLineItem(line: string): ParsedLine | null {
  const trimmed = line.replace(/\s+/g, ' ').trim();
  if (!trimmed || trimmed.length < 4) return null;

  const twoCol = trimmed.match(VALUE_PAIR_RE);
  if (!twoCol) return null;

  const value = parseNumber(twoCol[2]);
  if (value === null) return null;

  const label = normalizeLabel(twoCol[1].trim());
  if (SKIP_LABEL.test(label) || label.length < 3 || /^total\s/i.test(label)) return null;
  return { label, value };
}

function splitIntoSegments(block: string): string[] {
  const escaped = KNOWN_LINE_ITEMS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const splitRe = new RegExp(`(?=(?:${escaped.join('|')})\\b)`, 'g');
  return block.split(splitRe).map((s) => s.trim()).filter((s) => s.length > 4);
}

function countLineItems(block: string): number {
  return splitIntoSegments(block).map(parseLineItem).filter(Boolean).length;
}

function extractBalanceSheetBlock(text: string): string | null {
  const asAtRe = /as\s+at\s+\d{1,2}(?:st|nd|rd|th)?\s+\w+,?\s+\d{4}[\s\S]{0,120}?assets\s+non[- ]current/gi;
  let match: RegExpExecArray | null;

  while ((match = asAtRe.exec(text)) !== null) {
    const slice = text.slice(match.index);
    const endMatch = /total\s+equity\s+and\s+liabilities\s+[\d,()]+\s+[\d,()]+/i.exec(slice);
    if (!endMatch) continue;
    const block = slice.slice(0, endMatch.index + endMatch[0].length);
    if (countLineItems(block) >= 8) return block;
  }

  return null;
}

function inferCompanyName(text: string, fileName?: string): string {
  if (fileName && !/^(report|annual|statement|document|file|download)\b/i.test(fileName)) {
    const fromFile = fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b(annual|report|integrated|fy\d+)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (fromFile.length >= 3) return fromFile;
  }

  const candidates = [...text.matchAll(
    /([A-Z][A-Za-z0-9&.,'()\- ]{3,55}?(?:Limited|Ltd\.?|Inc\.?|Corporation|Corp\.?|Company|PLC|LLC))/g,
  )]
    .map((m) => m[1].trim().replace(/\s+/g, ' '))
    .filter(
      (n) =>
        n.split(/\s+/).length >= 2 &&
        !/^total\b/i.test(n) &&
        !/powering|aspirational|annual report|integrated annual/i.test(n),
    );

  if (candidates.length > 0) {
    return candidates.sort((a, b) => b.length - a.length)[0];
  }

  if (fileName) {
    return fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b(annual|report|integrated)\b/gi, '')
      .trim();
  }
  return 'Uploaded Company';
}

function inferPeriod(text: string): string {
  const asAt = text.match(/as\s+at\s+(\d{1,2}(?:st|nd|rd|th)?\s+\w+,?\s+\d{4})/i);
  if (asAt) return asAt[1].replace(/\s+/g, ' ');
  const fy = text.match(/\bFY\s*(\d{4}(?:-\d{2,4})?)\b/i);
  if (fy) return `FY ${fy[1]}`;
  const year = text.match(/\b(20\d{2})\b/);
  if (year) return `FY ${year[1]}`;
  return 'Latest period';
}

function inferCurrency(text: string): string {
  if (/\(.*?INR.*?\)|\bINR\b|₹|\(\s*₹\s*\)|\bin\s+crore\b/i.test(text)) return 'INR';
  if (/\bEUR\b|€/i.test(text)) return 'EUR';
  if (/\bGBP\b|£/i.test(text)) return 'GBP';
  return 'USD';
}

function classifyBlock(block: string): BalanceSheetExtraction | null {
  const assets = { current: [] as ParsedLine[], nonCurrent: [] as ParsedLine[] };
  const liabilities = { current: [] as ParsedLine[], nonCurrent: [] as ParsedLine[] };
  const equity: ParsedLine[] = [];

  const lower = block.toLowerCase();
  const curAssets = lower.search(/(?<![a-z-])current assets/);
  const totalAssets = lower.search(/total assets/);
  const eqAndLiab = lower.search(/equity and liabilities/);
  const liabHdr = lower.search(/liabilities\s+non[- ]current/);
  const curLiab = lower.search(/(?<![a-z-])current liabilities/);

  for (const segment of splitIntoSegments(block)) {
    const item = parseLineItem(segment);
    if (!item) continue;

    const idx = block.indexOf(segment);
    if (idx < 0) continue;

    if (idx < totalAssets || (totalAssets < 0 && idx < eqAndLiab)) {
      if (curAssets >= 0 && idx >= curAssets) assets.current.push(item);
      else assets.nonCurrent.push(item);
    } else if (eqAndLiab >= 0 && idx >= eqAndLiab && (liabHdr < 0 || idx < liabHdr)) {
      equity.push(item);
    } else if (liabHdr >= 0 && idx >= liabHdr) {
      if (curLiab >= 0 && idx >= curLiab) liabilities.current.push(item);
      else liabilities.nonCurrent.push(item);
    }
  }

  const totalItems =
    assets.current.length +
    assets.nonCurrent.length +
    liabilities.current.length +
    liabilities.nonCurrent.length +
    equity.length;

  if (totalItems < 8) return null;

  return {
    ticker: 'CUSTOM',
    companyName: 'Pending',
    period: 'Pending',
    currency: 'USD',
    title: 'Balance Sheet',
    assets,
    liabilities,
    equity,
    extractionConfidence: totalItems >= 15 ? 'high' : totalItems >= 10 ? 'medium' : 'low',
    extractionNotes: 'Parsed from document tables without AI.',
  };
}

export function tryHeuristicBalanceSheetExtraction(
  text: string,
  meta?: { fileName?: string },
): BalanceSheetExtraction | null {
  const block = extractBalanceSheetBlock(text);
  if (!block) return null;

  const parsed = classifyBlock(block);
  if (!parsed) return null;

  parsed.companyName = inferCompanyName(text, meta?.fileName);
  parsed.period = inferPeriod(block);
  parsed.currency = inferCurrency(`${block}\n${text.slice(0, 4000)}`);
  parsed.title = `${parsed.companyName} Balance Sheet`;
  parsed.ticker = parsed.companyName
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 6)
    .toUpperCase() || 'CUSTOM';

  return parsed;
}