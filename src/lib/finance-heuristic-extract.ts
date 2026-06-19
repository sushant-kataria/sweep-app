import type { BalanceSheetExtraction } from './finance-schemas';

type ParsedLine = { label: string; value: number };

const SKIP_LABEL =
  /^(assets|liabilities|equity|current|non[- ]current|total|as at|march|december|january|fy|in crore|usd|millions?|thousands?|notes?|material|see accompanying|\(|\)|annexure|financial liabilities|due to)/i;

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[,\s₹$€£H]/g, '').replace(/^\((.+)\)$/, '-$1');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const KNOWN_LINE_ITEMS = [
  'Property, Plant and Equipment',
  'Property, plant and equipment',
  'Other Intangible Assets Under Development',
  'Other Intangible Assets',
  'Capital Work-in-Progress',
  'Other Non-Current Assets',
  'Other Current Assets',
  'Cash and Cash Equivalents',
  'Cash and cash equivalents',
  'Marketable securities',
  'Accounts receivable',
  'Other receivables',
  'Other Bank Balances',
  'Equity Share Capital',
  'Equity Share capital',
  'Common stock',
  'Retained earnings',
  'Accumulated other comprehensive income',
  'Non-Controlling Interest',
  'Deferred Tax Liabilities (Net)',
  'Deferred tax liabilities',
  'Deferred Tax Assets (Net)',
  'Deferred tax assets',
  'Financial Assets Investments',
  'Other Financial Assets',
  'Trade Receivables',
  'Trade Payables',
  'Accounts payable',
  'Accrued liabilities',
  'Lease Liabilities',
  'Other Equity',
  'Inventories',
  'Borrowings',
  'Long-term debt',
  'Short-term debt',
  'Goodwill',
  'Provisions',
  'Spectrum',
  'Intangible assets',
  'Other assets',
  'Other current liabilities',
  'Other non-current liabilities',
  'Loans',
];

const VALUE_PAIR_RE =
  /^(.+?)\s+(?:\d{1,2}\s+)?([\d,()₹$€£]{2,}(?:\.\d+)?)(?:\s+[\d,()₹$€£]+(?:\.\d+)?)*$/;

function preprocessFinancialText(text: string): string {
  let t = text.replace(/\r/g, '\n');
  t = t.replace(/(\d{1,2})\s+(st|nd|rd|th)\b/gi, '$1$2');
  t = t.replace(/\s+/g, ' ');

  const breaks = [
    'Balance Sheet',
    'CONSOLIDATED BALANCE SHEET',
    'Assets Non-Current',
    'Non-Current Assets',
    'Current Assets',
    'Total Assets',
    'Equity and Liabilities',
    'Non-Current Liabilities',
    'Current Liabilities',
    'Total Equity and Liabilities',
    'Total Liabilities',
    'Shareholders equity',
    'Shareholders equity',
    ...KNOWN_LINE_ITEMS,
  ];

  for (const term of breaks) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(`\\s+(${escaped})`, 'gi'), '\n$1');
  }

  return t;
}

function normalizeLabel(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  for (const known of KNOWN_LINE_ITEMS) {
    if (cleaned.toLowerCase().includes(known.toLowerCase())) return known;
  }
  return cleaned
    .replace(/^.*?(?:Non-Current Assets|Current Assets|Financial Liabilities|Equity and Liabilities Equity|Equity)\s+/i, '')
    .trim();
}

function parseLineItem(line: string): ParsedLine | null {
  const trimmed = line.replace(/\s+/g, ' ').trim();
  if (!trimmed || trimmed.length < 4) return null;

  const twoCol = trimmed.match(VALUE_PAIR_RE);
  if (!twoCol) return null;

  const value = parseNumber(twoCol[2]);
  if (value === null || Math.abs(value) < 10) return null;

  const label = normalizeLabel(twoCol[1].trim());
  if (SKIP_LABEL.test(label) || label.length < 3 || /^total\s/i.test(label)) return null;
  return { label, value };
}

function splitIntoSegments(block: string): string[] {
  const normalized = preprocessFinancialText(block);
  const lineSegments = normalized
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);

  if (lineSegments.length >= 6) return lineSegments;

  const escaped = KNOWN_LINE_ITEMS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const splitRe = new RegExp(`(?=(?:${escaped.join('|')})\\b)`, 'gi');
  return normalized.split(splitRe).map((s) => s.trim()).filter((s) => s.length > 4);
}

function countLineItems(block: string): number {
  return splitIntoSegments(block).map(parseLineItem).filter(Boolean).length;
}

function sliceToEnd(slice: string, endPatterns: RegExp[], minItems = 5): string | null {
  for (const endRe of endPatterns) {
    const endMatch = endRe.exec(slice);
    if (!endMatch) continue;
    const block = slice.slice(0, endMatch.index + endMatch[0].length);
    if (countLineItems(block) >= minItems) return block;
  }
  return null;
}

function extractByTotalEquityMarker(text: string): string | null {
  const endRe =
    /total\s+(?:equity\s+and\s+liabilities|liabilities\s+and\s+(?:shareholders?|stockholders?)(?:'|')?\s+equity)\s+[\d,()₹$€£\s]+[\d,()₹$€£]+/gi;
  let match: RegExpExecArray | null;
  let best: string | null = null;
  let bestCount = 0;

  while ((match = endRe.exec(text)) !== null) {
    const end = match.index + match[0].length;
    const startSearch = Math.max(0, match.index - 30_000);
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
    const items = countLineItems(block);
    if (items > bestCount) {
      bestCount = items;
      best = block;
    }
  }

  return bestCount >= 5 ? best : null;
}

function extractUsBalanceSheetBlock(text: string): string | null {
  const headerRe =
    /(?:consolidated\s+)?balance\s+sheets?|statements?\s+of\s+financial\s+position/gi;
  const endPatterns = [
    /total\s+liabilities\s+and\s+(?:shareholders?|stockholders?)(?:'|')?\s+equity[^\d]*[\d,()]+/i,
    /total\s+liabilities\s+and\s+equity[^\d]*[\d,()]+/i,
    /total\s+assets[^\d]*[\d,()]+(?:\s+[\d,()]+)?/i,
  ];

  let match: RegExpExecArray | null;
  while ((match = headerRe.exec(text)) !== null) {
    const slice = text.slice(match.index, match.index + 80_000);
    const block = sliceToEnd(slice, endPatterns, 5);
    if (block) return block;
  }
  return null;
}

function extractIndiaUkBalanceSheetBlock(text: string): string | null {
  const asAtRe =
    /as\s+at\s+\d{1,2}\s*(?:st|nd|rd|th)?\s+\w+,?\s+\d{4}[\s\S]{0,300}?(?:assets\s+non[- ]current|equity\s+and\s+liabilities)/gi;
  let match: RegExpExecArray | null;

  while ((match = asAtRe.exec(text)) !== null) {
    const slice = text.slice(match.index);
    const block = sliceToEnd(
      slice,
      [/total\s+equity\s+and\s+liabilities\s+[\d,()]+\s+[\d,()]+/i],
      5,
    );
    if (block) return block;
  }
  return null;
}

function extractGenericFinancialBlock(text: string): string | null {
  const normalized = preprocessFinancialText(text);
  const markers = [
    /(?:non[- ]current|current)\s+assets/i,
    /balance\s+sheet/i,
    /statement\s+of\s+financial\s+position/i,
    /equity\s+and\s+liabilities/i,
  ];

  let start = -1;
  for (const marker of markers) {
    const idx = normalized.search(marker);
    if (idx >= 0 && (start < 0 || idx < start)) start = idx;
  }
  if (start < 0) return null;

  const slice = normalized.slice(start, start + 40_000);
  if (countLineItems(slice) >= 5) return slice;
  return null;
}

function extractBalanceSheetBlock(text: string): string | null {
  const normalized = preprocessFinancialText(text);
  return (
    extractByTotalEquityMarker(normalized) ??
    extractUsBalanceSheetBlock(normalized) ??
    extractIndiaUkBalanceSheetBlock(normalized) ??
    extractGenericFinancialBlock(normalized)
  );
}

function trySpreadsheetExtraction(
  text: string,
  meta?: { fileName?: string },
): BalanceSheetExtraction | null {
  if (!/###\s*Sheet:| \| /.test(text)) return null;

  const assets = { current: [] as ParsedLine[], nonCurrent: [] as ParsedLine[] };
  const liabilities = { current: [] as ParsedLine[], nonCurrent: [] as ParsedLine[] };
  const equity: ParsedLine[] = [];

  let section: 'assets-nc' | 'assets-c' | 'liab-nc' | 'liab-c' | 'equity' = 'assets-nc';

  for (const rawLine of text.split(/\n+/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('### Sheet:')) continue;

    const lower = line.toLowerCase();
    if (/current\s+assets?/.test(lower)) section = 'assets-c';
    else if (/non[- ]?current\s+assets?|fixed\s+assets?/.test(lower)) section = 'assets-nc';
    else if (/current\s+liabilit/.test(lower)) section = 'liab-c';
    else if (/non[- ]?current\s+liabilit|long[- ]term\s+liabilit/.test(lower)) section = 'liab-nc';
    else if (/equity|shareholders?|stockholders?/.test(lower) && !/liabilit/.test(lower)) section = 'equity';

    if (!line.includes(' | ')) continue;
    const cols = line.split(' | ').map((c) => c.trim()).filter(Boolean);
    if (cols.length < 2) continue;

    const label = cols[0];
    if (SKIP_LABEL.test(label) || /^total\b/i.test(label)) continue;

    const valueCol = cols.find((c, i) => i > 0 && parseNumber(c) !== null && Math.abs(parseNumber(c)!) >= 10);
    if (!valueCol) continue;
    const value = parseNumber(valueCol);
    if (value === null) continue;

    const item = { label: normalizeLabel(label), value };
    if (section === 'assets-c') assets.current.push(item);
    else if (section === 'assets-nc') assets.nonCurrent.push(item);
    else if (section === 'liab-c') liabilities.current.push(item);
    else if (section === 'liab-nc') liabilities.nonCurrent.push(item);
    else equity.push(item);
  }

  const totalItems =
    assets.current.length +
    assets.nonCurrent.length +
    liabilities.current.length +
    liabilities.nonCurrent.length +
    equity.length;
  if (totalItems < 5) return null;

  const companyName = inferCompanyName(text, meta?.fileName);
  return {
    ticker: 'CUSTOM',
    companyName,
    period: inferPeriod(text),
    currency: inferCurrency(text),
    title: `${companyName} Balance Sheet`,
    assets,
    liabilities,
    equity,
    extractionConfidence: totalItems >= 12 ? 'medium' : 'low',
    extractionNotes: 'Parsed from spreadsheet without AI.',
  };
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
  const asAt = text.match(/as\s+at\s+(\d{1,2}\s*(?:st|nd|rd|th)?\s+\w+,?\s+\d{4})/i);
  if (asAt) return asAt[1].replace(/\s+/g, ' ');
  const usDate = text.match(
    /\b((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+20\d{2})\b/i,
  );
  if (usDate) return usDate[1].replace(/\s+/g, ' ');
  const fy = text.match(/\bFY\s*(\d{4}(?:-\d{2,4})?)\b/i);
  if (fy) return `FY ${fy[1]}`;
  const year = text.match(/\b(20\d{2})\b/);
  if (year) return `FY ${year[1]}`;
  return 'Latest period';
}

function inferCurrency(text: string): string {
  if (/\(.*?INR.*?\)|\bINR\b|₹|\(\s*₹\s*\)|\bin\s+crore\b|\(\s*H\s+in\s+crore\s*\)/i.test(text)) return 'INR';
  if (/\bEUR\b|€/i.test(text)) return 'EUR';
  if (/\bGBP\b|£/i.test(text)) return 'GBP';
  return 'USD';
}

function classifyBlock(block: string): BalanceSheetExtraction | null {
  const assets = { current: [] as ParsedLine[], nonCurrent: [] as ParsedLine[] };
  const liabilities = { current: [] as ParsedLine[], nonCurrent: [] as ParsedLine[] };
  const equity: ParsedLine[] = [];

  const normalized = preprocessFinancialText(block);
  const lower = normalized.toLowerCase();
  const curAssets = lower.search(/(?<![a-z-])current assets/);
  const totalAssets = lower.search(/total assets/);
  const eqAndLiab = lower.search(/equity and liabilities/);
  const liabHdr = lower.search(/liabilities\s+non[- ]current/);
  const curLiab = lower.search(/(?<![a-z-])current liabilities/);
  const usLiabHdr = lower.search(
    /(?:total\s+)?liabilities(?:\s+and\s+(?:shareholders?|stockholders?)(?:'|')?\s+equity)?\s*:?/,
  );
  const usEquityHdr = lower.search(
    /(?:shareholders?|stockholders?)(?:'|')?\s+equity|total\s+shareholders?/,
  );
  const usNonCurLiab = lower.search(/non[- ]current liabilities/);

  for (const segment of splitIntoSegments(block)) {
    const item = parseLineItem(segment);
    if (!item) continue;

    const idx = normalized.toLowerCase().indexOf(segment.toLowerCase().slice(0, 24));
    if (idx < 0) continue;

    const inAssets =
      totalAssets >= 0 ? idx < totalAssets : eqAndLiab >= 0 ? idx < eqAndLiab : usLiabHdr >= 0 && idx < usLiabHdr;

    if (inAssets) {
      if (curAssets >= 0 && idx >= curAssets) assets.current.push(item);
      else assets.nonCurrent.push(item);
    } else if (eqAndLiab >= 0 && idx >= eqAndLiab && (liabHdr < 0 || idx < liabHdr)) {
      equity.push(item);
    } else if (usEquityHdr >= 0 && idx >= usEquityHdr) {
      equity.push(item);
    } else if (liabHdr >= 0 && idx >= liabHdr) {
      if (curLiab >= 0 && idx >= curLiab) liabilities.current.push(item);
      else liabilities.nonCurrent.push(item);
    } else if (usLiabHdr >= 0 && idx >= usLiabHdr) {
      if (usNonCurLiab >= 0 && idx >= usNonCurLiab) {
        if (curLiab >= 0 && idx >= curLiab) liabilities.current.push(item);
        else liabilities.nonCurrent.push(item);
      } else if (curLiab >= 0 && idx >= curLiab) {
        liabilities.current.push(item);
      } else {
        liabilities.nonCurrent.push(item);
      }
    }
  }

  const totalItems =
    assets.current.length +
    assets.nonCurrent.length +
    liabilities.current.length +
    liabilities.nonCurrent.length +
    equity.length;

  if (totalItems < 5) return null;

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
  const spreadsheet = trySpreadsheetExtraction(text, meta);
  if (spreadsheet) {
    spreadsheet.ticker =
      spreadsheet.companyName
        .split(/\s+/)
        .filter((w) => /^[A-Z]/.test(w))
        .map((w) => w[0])
        .join('')
        .slice(0, 6)
        .toUpperCase() || 'CUSTOM';
    return spreadsheet;
  }

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