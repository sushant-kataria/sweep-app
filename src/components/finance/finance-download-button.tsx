'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { downloadFinanceReportPdf } from '@/lib/finance-report-pdf';
import type { FinanceSession } from '@/lib/finance-types';

export function FinanceDownloadButton({ session }: { session: FinanceSession }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      downloadFinanceReportPdf(session);
    } finally {
      window.setTimeout(() => setLoading(false), 400);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      disabled={loading}
      className="finance-secondary-btn inline-flex items-center gap-2"
      aria-label="Download report PDF"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      Download PDF
    </button>
  );
}