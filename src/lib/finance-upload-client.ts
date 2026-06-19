'use client';

import type { ExtractedDocument } from './finance-extract';
import { prepareUploadText } from './finance-upload-prep';

const MAX_PDF_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_SPREADSHEET_UPLOAD_BYTES = 10 * 1024 * 1024;

type PdfTextItem = { str: string; x: number; y: number };

function pageTextItemsToLines(items: PdfTextItem[]): string {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: string[] = [];
  let currentY = Number.NaN;
  let currentLine: string[] = [];

  for (const item of sorted) {
    if (!Number.isFinite(currentY) || Math.abs(item.y - currentY) > 4) {
      if (currentLine.length > 0) lines.push(currentLine.join(' '));
      currentLine = [item.str];
      currentY = item.y;
    } else {
      currentLine.push(item.str);
    }
  }

  if (currentLine.length > 0) lines.push(currentLine.join(' '));
  return lines.join('\n');
}

async function extractPdfTextInBrowser(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const parts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items: PdfTextItem[] = [];

    for (const item of content.items) {
      if (!('str' in item) || !('transform' in item)) continue;
      items.push({
        str: String(item.str),
        x: item.transform[4],
        y: item.transform[5],
      });
    }

    parts.push(pageTextItemsToLines(items));
  }

  return parts.join('\n');
}

async function extractSpreadsheetInBrowser(buffer: ArrayBuffer, fileName: string): Promise<ExtractedDocument> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const parts = workbook.SheetNames.map((name) => {
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(workbook.Sheets[name], {
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
  });

  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'xlsx';
  const raw = parts.join('\n\n');
  return {
    fileName,
    mimeType: ext === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    text: prepareUploadText(raw),
    sheetNames: workbook.SheetNames,
  };
}

export async function extractUploadedFile(
  file: File,
): Promise<{ doc: ExtractedDocument; dataSource: 'pdf' | 'excel' | 'csv' }> {
  const name = file.name.toLowerCase();
  const isPdf = name.endsWith('.pdf');
  const isSpreadsheet = ['.xlsx', '.xls', '.csv', '.xlsm'].some((ext) => name.endsWith(ext));

  if (!isPdf && !isSpreadsheet) {
    throw new Error('Upload a PDF annual report, or .xlsx / .xls / .xlsm / .csv spreadsheet.');
  }

  const maxSize = isPdf ? MAX_PDF_UPLOAD_BYTES : MAX_SPREADSHEET_UPLOAD_BYTES;
  if (file.size > maxSize) {
    throw new Error(`File must be under ${isPdf ? '15' : '10'} MB.`);
  }

  const buffer = await file.arrayBuffer();

  if (isPdf) {
    const raw = await extractPdfTextInBrowser(buffer);
    if (!raw.trim()) {
      throw new Error(
        'No readable text in this PDF. Scanned image-only filings are not supported yet — use a text-based PDF or SEC EDGAR HTML.',
      );
    }
    return {
      doc: {
        fileName: file.name,
        mimeType: 'application/pdf',
        text: prepareUploadText(raw),
      },
      dataSource: 'pdf',
    };
  }

  const doc = await extractSpreadsheetInBrowser(buffer, file.name);
  return {
    doc,
    dataSource: name.endsWith('.csv') ? 'csv' : 'excel',
  };
}