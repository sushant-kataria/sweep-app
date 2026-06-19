'use client';

import { useRef, useState } from 'react';
import { FileSpreadsheet, Link2, Loader2, Upload } from 'lucide-react';
import { COMPANY_OPTIONS, getDefaultPeriod, getPeriodsForTicker } from '@/lib/finance-data';
import { buildPreloadedFinanceSession } from '@/lib/finance-session';
import { extractUploadedFile } from '@/lib/finance-upload-client';
import type { FinanceSession, ReportType } from '@/lib/finance-types';

type SourceTab = 'demo' | 'url' | 'upload';

type Props = {
  onSession: (session: FinanceSession) => void;
  onError: (msg: string) => void;
};

const STEPS = ['Reading document', 'Extracting balance sheet', 'Computing metrics', 'Generating analysis'];

export function FinanceBuilder({ onSession, onError }: Props) {
  const [tab, setTab] = useState<SourceTab>('demo');
  const [ticker, setTicker] = useState('AAPL');
  const [period, setPeriod] = useState(() => getDefaultPeriod('AAPL'));
  const [reportType, setReportType] = useState<ReportType>('balance_sheet');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileBlobRef = useRef<File | null>(null);

  const periods = getPeriodsForTicker(ticker);

  const parseAnalyzeResponse = async (res: Response) => {
    const raw = await res.text();
    if (!raw.trim()) {
      if (res.status === 413) {
        throw new Error('Upload too large for the server. Try a smaller file or use Top 25 US.');
      }
      throw new Error(`Analysis failed (${res.status}). Please try again.`);
    }
    try {
      return JSON.parse(raw) as FinanceSession & { error?: string };
    } catch {
      if (res.status === 413 || /too large|payload/i.test(raw)) {
        throw new Error('File is too large for cloud upload. Processing locally — retry in a moment.');
      }
      throw new Error(raw.slice(0, 200) || 'Analysis failed — unexpected server response.');
    }
  };

  const runAnalyze = async (body: object) => {
    setLoading(true);
    setStep(0);
    onError('');

    const stepTimer = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 2200);

    try {
      const res = await fetch('/api/finance/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await parseAnalyzeResponse(res);
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed.');
      onSession(data as FinanceSession);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Analysis failed.';
      onError(
        /expected pattern/i.test(msg)
          ? 'Could not read the server response. Large PDFs are processed in your browser first — please retry.'
          : msg,
      );
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
      setStep(0);
    }
  };

  const handleDemo = () => {
    if (reportType !== 'balance_sheet') {
      onError('Only balance sheet reports are available in this release.');
      return;
    }
    onError('');
    const session = buildPreloadedFinanceSession(ticker, period);
    if (!session) {
      onError('No pre-loaded report for that company yet.');
      return;
    }
    onSession(session);
  };

  const handleUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      onError('Paste a link to an annual report, 10-K, or filing page.');
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      onError('Enter a valid http or https URL.');
      return;
    }
    void runAnalyze({ source: 'url', url: trimmed });
  };

  const handleUpload = () => {
    const file = fileBlobRef.current;
    if (!file) {
      onError('Choose a PDF or spreadsheet file first.');
      return;
    }
    void (async () => {
      setLoading(true);
      setStep(0);
      onError('');
      const stepTimer = window.setInterval(() => {
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
      }, 2200);
      try {
        const { doc, dataSource } = await extractUploadedFile(file);
        const res = await fetch('/api/finance/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'upload',
            fileName: file.name,
            dataSource,
            doc: {
              text: doc.text,
              mimeType: doc.mimeType,
              sheetNames: doc.sheetNames,
            },
          }),
        });
        const data = await parseAnalyzeResponse(res);
        if (!res.ok) throw new Error(data.error ?? 'Analysis failed.');
        onSession(data as FinanceSession);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not read this file.';
        onError(/expected pattern/i.test(msg) ? 'Could not read the server response — please retry.' : msg);
      } finally {
        clearInterval(stepTimer);
        setLoading(false);
        setStep(0);
      }
    })();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      fileBlobRef.current = file;
      setFileName(file.name);
    }
  };

  return (
    <div className="finance-builder">
      <div className="finance-builder-icon">
        <FileSpreadsheet className="h-8 w-8 text-[var(--v-fg-3)]" />
      </div>
      <h1 className="text-xl font-semibold text-[var(--v-fg)]">Institutional-grade financial analysis</h1>
      <p className="mt-1 max-w-lg text-sm text-[var(--v-fg-3)]">
        Import any annual statement via link, PDF upload, or spreadsheet. Sweep extracts the balance sheet, computes
        ratios, and produces analyst-quality commentary.
      </p>

      <div className="finance-source-tabs">
        {(
          [
            { id: 'demo' as const, label: 'Top 25 US', icon: FileSpreadsheet },
            { id: 'url' as const, label: 'Annual report link', icon: Link2 },
            { id: 'upload' as const, label: 'Upload file', icon: Upload },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`finance-source-tab ${tab === id ? 'finance-source-tab--active' : ''}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="finance-builder-form">
        {tab === 'demo' && (
          <>
            <label className="finance-field">
              <span>Company</span>
              <select
                value={ticker}
                onChange={(e) => {
                  setTicker(e.target.value);
                  setPeriod(getDefaultPeriod(e.target.value));
                }}
                className="finance-input"
                disabled={loading}
              >
                {COMPANY_OPTIONS.map((c) => (
                  <option key={c.ticker} value={c.ticker}>
                    {c.name} ({c.ticker})
                  </option>
                ))}
              </select>
            </label>
            <label className="finance-field">
              <span>Period</span>
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="finance-input" disabled={loading}>
                {periods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="finance-field">
              <span>Report type</span>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="finance-input"
                disabled={loading}
              >
                <option value="balance_sheet">Balance Sheet</option>
              </select>
            </label>
                <button type="button" onClick={handleDemo} disabled={loading} className="finance-primary-btn">
                  Generate report
                </button>
                <p className="text-[11px] text-[var(--v-fg-4)]">
                  Latest quarterly balance sheets pre-loaded from SEC EDGAR — instant report.
                </p>
          </>
        )}

        {tab === 'url' && (
          <>
            <label className="finance-field">
              <span>Annual statement URL</span>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.sec.gov/Archives/edgar/... or investor relations PDF"
                className="finance-input"
                disabled={loading}
              />
            </label>
            <p className="text-[11px] text-[var(--v-fg-4)]">
              Supports SEC EDGAR HTML pages, investor PDFs, and direct spreadsheet links.
            </p>
            <button type="button" onClick={handleUrl} disabled={loading} className="finance-primary-btn">
              {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Analyze from link'}
            </button>
          </>
        )}

        {tab === 'upload' && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.xlsm,.csv,application/pdf"
              className="hidden"
              onChange={onFileChange}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="finance-upload-zone"
            >
              <Upload className="h-5 w-5 text-[var(--v-fg-4)]" />
              <span className="text-sm text-[var(--v-fg-3)]">
                {fileName || 'Drop or click to upload PDF, Excel, or CSV'}
              </span>
            </button>
            <p className="text-[11px] text-[var(--v-fg-4)]">
              PDF annual reports up to 15 MB. Text is extracted in your browser, then analyzed in the cloud — works on
              Vercel with large filings. Scanned image PDFs are not supported yet.
            </p>
            <button type="button" onClick={handleUpload} disabled={loading || !fileName} className="finance-primary-btn">
              {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Analyze document'}
            </button>
          </>
        )}

        {loading && (
          <div className="finance-loading-steps">
            {STEPS.map((label, i) => (
              <p key={label} className={i <= step ? 'finance-loading-step finance-loading-step--active' : 'finance-loading-step'}>
                {i < step ? '✓' : i === step ? '…' : '○'} {label}
              </p>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-[var(--v-fg-5)]">
        Educational analysis only — not investment advice. Verify figures against official filings.
      </p>
    </div>
  );
}