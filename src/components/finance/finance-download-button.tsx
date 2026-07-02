'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { downloadFinanceReportPdf } from '@/lib/finance-report-pdf';
import type { FinanceSession } from '@/lib/finance-types';

async function startCheckout(returnPath: string) {
  const res = await fetch(`/api/stripe/checkout?returnPath=${encodeURIComponent(returnPath)}`, {
    method: 'POST',
  });
  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
    return;
  }
  if (res.status === 401) {
    window.location.href = `/login?returnPathname=${encodeURIComponent(returnPath)}`;
    return;
  }
  throw new Error(data.error ?? 'Checkout failed.');
}

export function FinanceDownloadButton({ session }: { session: FinanceSession }) {
  const pathname = usePathname();
  const { loading, pro, signedIn } = useSubscription();
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      downloadFinanceReportPdf(session);
    } finally {
      window.setTimeout(() => setBusy(false), 400);
    }
  };

  if (loading) {
    return (
      <button type="button" disabled className="finance-secondary-btn inline-flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Download PDF
      </button>
    );
  }

  if (!pro) {
    return signedIn ? (
      <button
        type="button"
        className="finance-secondary-btn inline-flex items-center gap-2"
        onClick={() => void startCheckout(pathname || '/finance')}
      >
        <Download className="h-3.5 w-3.5" />
        Pro — download PDF
      </button>
    ) : (
      <Link href={`/login?returnPathname=${encodeURIComponent(pathname || '/finance')}`} className="finance-secondary-btn inline-flex items-center gap-2">
        <Download className="h-3.5 w-3.5" />
        Sign in to download
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      disabled={busy}
      className="finance-secondary-btn inline-flex items-center gap-2"
      aria-label="Download report PDF"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      Download PDF
    </button>
  );
}
