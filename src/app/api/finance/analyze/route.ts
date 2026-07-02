import { NextResponse } from 'next/server';

import { analyzeDocument } from '@/lib/finance-analyze';
import { isGeneratedReportRequest } from '@/lib/finance-auth';
import { requireFinanceProApi } from '@/lib/finance-pro-auth';
import { isFreeFinanceTicker } from '@/lib/free-tier';
import {
  extractFromPdfFile,
  extractFromSpreadsheet,
  extractFromUrl,
  MAX_PDF_UPLOAD_BYTES,
  MAX_SPREADSHEET_UPLOAD_BYTES,
} from '@/lib/finance-extract';
import { buildPreloadedFinanceSession } from '@/lib/finance-session';
import type { FinanceSession } from '@/lib/finance-types';

export const runtime = 'nodejs';
export const maxDuration = 60;

function buildDemoSession(ticker: string, period: string): FinanceSession {
  const session = buildPreloadedFinanceSession(ticker, period);
  if (!session) throw new Error('No pre-loaded data for that company and period.');
  return session;
}

async function proRequiredResponse() {
  return NextResponse.json(
    { error: 'Pro subscription required for custom uploads and URL analysis.' },
    { status: 402 },
  );
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      if (!(await requireFinanceProApi())) {
        return proRequiredResponse();
      }
      const form = await req.formData();
      const file = form.get('file');
      const url = String(form.get('url') ?? '').trim();

      if (url) {
        const doc = await extractFromUrl(url);
        const session = await analyzeDocument(doc, { dataSource: 'url', sourceUrl: url });
        return NextResponse.json(session);
      }

      if (file instanceof File) {
        const name = file.name.toLowerCase();
        const isPdf = name.endsWith('.pdf');
        const isSpreadsheet = ['.xlsx', '.xls', '.csv', '.xlsm'].some((ext) => name.endsWith(ext));

        if (!isPdf && !isSpreadsheet) {
          return NextResponse.json(
            { error: 'Upload a PDF annual report, or .xlsx / .xls / .xlsm / .csv spreadsheet.' },
            { status: 400 },
          );
        }

        const maxSize = isPdf ? MAX_PDF_UPLOAD_BYTES : MAX_SPREADSHEET_UPLOAD_BYTES;
        if (file.size > maxSize) {
          return NextResponse.json(
            { error: `File must be under ${isPdf ? '15' : '10'} MB.` },
            { status: 400 },
          );
        }

        const buffer = await file.arrayBuffer();
        const doc = isPdf
          ? await extractFromPdfFile(buffer, file.name)
          : await extractFromSpreadsheet(buffer, file.name);
        const dataSource = isPdf ? 'pdf' : name.endsWith('.csv') ? 'csv' : 'excel';
        const session = await analyzeDocument(doc, { dataSource, sourceFileName: file.name });
        return NextResponse.json(session);
      }

      return NextResponse.json({ error: 'Provide a file or URL.' }, { status: 400 });
    }

    const body = await req.json();
    const { source, ticker, period, url, doc, dataSource, fileName } = body as {
      source?: 'demo' | 'url' | 'upload';
      ticker?: string;
      period?: string;
      url?: string;
      doc?: { text: string; mimeType: string; sheetNames?: string[] };
      dataSource?: 'pdf' | 'excel' | 'csv';
      fileName?: string;
    };

    if (isGeneratedReportRequest(body)) {
      if (!(await requireFinanceProApi())) {
        return proRequiredResponse();
      }
    }

    if (source === 'upload' && doc?.text?.trim()) {
      const session = await analyzeDocument(
        {
          fileName: fileName ?? 'upload',
          mimeType: doc.mimeType ?? 'text/plain',
          text: doc.text,
          sheetNames: doc.sheetNames,
        },
        {
          dataSource: dataSource ?? 'pdf',
          sourceFileName: fileName,
        },
      );
      return NextResponse.json(session);
    }

    if (source === 'url' && url) {
      const doc = await extractFromUrl(url.trim());
      const session = await analyzeDocument(doc, { dataSource: 'url', sourceUrl: url.trim() });
      return NextResponse.json(session);
    }

    if (source === 'demo' || ticker) {
      const session = await buildDemoSession(
        String(ticker ?? 'WMT').toUpperCase(),
        String(period ?? 'FY 2024'),
      );
      return NextResponse.json(session);
    }

    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Analysis failed.';
    console.error('[finance/analyze]', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}