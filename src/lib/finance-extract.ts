import * as XLSX from 'xlsx';
import { extractText, getDocumentProxy } from 'unpdf';

import { focusBalanceSheetForUpload, MAX_STORED_CHARS } from './finance-focus';

/** Max chars sent to AI (~3k tokens) — stays under provider TPM limits */
const MAX_AI_CHARS = 12_000;
const MAX_URL_BYTES = 12 * 1024 * 1024;
export const MAX_PDF_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_SPREADSHEET_UPLOAD_BYTES = 10 * 1024 * 1024;

const HIGH_CONFIDENCE_MARKERS = [
  /consolidated\s+balance\s+sheet[\s\S]{0,120}?as\s+at/gi,
  /as\s+at\s+\d{1,2}\s*(?:st|nd|rd|th)?\s+\w+,?\s+\d{4}[\s\S]{0,200}?assets\s+non[- ]current/gi,
  /balance\s+sheet\s+as\s+at/gi,
  /condensed\s+consolidated\s+balance\s+sheets?/gi,
  /statements?\s+of\s+financial\s+position/gi,
  /(?:consolidated\s+)?balance\s+sheets?/gi,
];

const WINDOW_CHARS = 25_000;

export type ExtractedDocument = {
  fileName?: string;
  sourceUrl?: string;
  mimeType: string;
  text: string;
  sheetNames?: string[];
};

function capText(text: string, max: number) {
  if (text.length <= max) return text;
  const head = Math.floor(max * 0.55);
  const tail = max - head - 40;
  return `${text.slice(0, head)}\n\n[...content truncated...]\n\n${text.slice(-tail)}`;
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function numericDensity(slice: string): number {
  const lines = slice.split(/\n+/).filter((l) => l.trim().length > 3);
  if (lines.length === 0) return 0;
  const withNumbers = lines.filter((l) => /\d[\d,]{2,}/.test(l)).length;
  return withNumbers / lines.length;
}

/** Pull balance-sheet sections and financial line items from long filings. */
export function narrowForBalanceSheetExtraction(text: string): string {
  const chunks: Array<{ start: number; end: number; score: number }> = [];

  for (const marker of HIGH_CONFIDENCE_MARKERS) {
    marker.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = marker.exec(text)) !== null) {
      const start = Math.max(0, match.index);
      const end = Math.min(text.length, start + WINDOW_CHARS);
      const slice = text.slice(start, end);
      const score = numericDensity(slice) + (/\btotal\s+assets\b/i.test(slice) ? 0.3 : 0);
      chunks.push({ start, end, score });
    }
  }

  if (chunks.length > 0) {
    chunks.sort((a, b) => b.score - a.score || a.start - b.start);
    const best = chunks[0];
    const combined = text.slice(best.start, best.end);
    if (combined.length >= 500 && best.score >= 0.15) return capText(combined, MAX_AI_CHARS);
  }

  const lines = text.split(/\n+/);
  const financial = lines.filter(
    (line) =>
      line.trim().length > 2 &&
      /\d/.test(line) &&
      /asset|liabilit|equity|cash|debt|receivable|inventory|payable|stockholder|retained|million|thousand/i.test(
        line,
      ),
  );

  if (financial.length >= 8) {
    const header = text.slice(0, Math.min(2500, text.length));
    const body = financial.slice(0, 120).join('\n');
    return capText(`${header}\n\n--- FINANCIAL LINES ---\n${body}`, MAX_AI_CHARS);
  }

  return capText(text, MAX_AI_CHARS);
}

function sheetToText(sheet: XLSX.WorkSheet, name: string): string {
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as (string | number | null)[][];

  const lines = rows
    .map((row) =>
      row
        .map((cell) => String(cell ?? '').trim())
        .filter(Boolean)
        .join(' | '),
    )
    .filter(Boolean);

  return `### Sheet: ${name}\n${lines.join('\n')}`;
}

export async function extractFromSpreadsheet(buffer: ArrayBuffer, fileName: string): Promise<ExtractedDocument> {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const parts = workbook.SheetNames.map((name) => sheetToText(workbook.Sheets[name], name));
  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'xlsx';
  const text = capText(parts.join('\n\n'), MAX_STORED_CHARS);

  return {
    fileName,
    mimeType: ext === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    text,
    sheetNames: workbook.SheetNames,
  };
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join('\n') : String(text);
}

export async function extractFromPdfFile(buffer: ArrayBuffer, fileName: string): Promise<ExtractedDocument> {
  const raw = await extractPdfText(buffer);
  if (!raw.trim()) {
    throw new Error(
      'No readable text in this PDF. Scanned image-only filings are not supported yet — use a text-based PDF or SEC EDGAR HTML.',
    );
  }
  return {
    fileName,
    mimeType: 'application/pdf',
    text: focusBalanceSheetForUpload(raw),
  };
}

export async function extractFromUrl(url: string): Promise<ExtractedDocument> {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are supported.');
  }

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'SweepFinance/1.0 (financial analysis; +https://sweep-app.vercel.app)',
      Accept: 'text/html,application/pdf,application/json,text/plain,*/*',
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`Could not fetch URL (${res.status}). Try a direct annual report or 10-K link.`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > MAX_URL_BYTES) {
    throw new Error('File is too large. Upload the Excel/CSV version or use a smaller filing link.');
  }

  let text = '';
  if (contentType.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
    text = await extractPdfText(buffer);
  } else if (contentType.includes('html') || contentType.includes('text/plain')) {
    text = stripHtml(new TextDecoder().decode(buffer));
  } else if (
    contentType.includes('spreadsheet') ||
    contentType.includes('excel') ||
    url.toLowerCase().match(/\.(xlsx|xls|csv)$/)
  ) {
    const doc = await extractFromSpreadsheet(buffer, url.split('/').pop() ?? 'download.xlsx');
    return { ...doc, sourceUrl: url };
  } else {
    text = stripHtml(new TextDecoder().decode(buffer));
  }

  if (!text.trim()) {
    throw new Error('No readable text found at that URL. Try an HTML 10-K page or upload Excel/CSV.');
  }

  return {
    sourceUrl: url,
    mimeType: contentType || 'text/plain',
    text: capText(text, MAX_STORED_CHARS),
  };
}

export function buildExtractionPrompt(doc: ExtractedDocument) {
  const meta = [
    doc.fileName ? `File: ${doc.fileName}` : null,
    doc.sourceUrl ? `URL: ${doc.sourceUrl}` : null,
    doc.sheetNames?.length ? `Sheets: ${doc.sheetNames.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const focused = narrowForBalanceSheetExtraction(doc.text);

  return `${meta ? `${meta}\n\n` : ''}DOCUMENT CONTENT (balance-sheet focus):\n${focused}`;
}