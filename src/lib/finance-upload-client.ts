'use client';

import type { ExtractedDocument } from './finance-extract';

const MAX_STORED_CHARS = 60_000;
const MAX_PDF_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_SPREADSHEET_UPLOAD_BYTES = 10 * 1024 * 1024;

function capText(text: string, max: number) {
  if (text.length <= max) return text;
  const head = Math.floor(max * 0.55);
  const tail = max - head - 40;
  return `${text.slice(0, head)}\n\n[...content truncated...]\n\n${text.slice(-tail)}`;
}

async function extractPdfTextInBrowser(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const version = pdfjs.version ?? '4.10.38';
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/legacy/build/pdf.worker.min.mjs`;

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const parts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .join(' ');
    parts.push(pageText);
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
  return {
    fileName,
    mimeType: ext === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    text: capText(parts.join('\n\n'), MAX_STORED_CHARS),
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
        text: capText(raw, MAX_STORED_CHARS),
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