'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Eye } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import {
  formatSampleHeadline,
  formatSamplePurpose,
  type FreeSamplePreview,
} from '@/lib/free-tier-copy';

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

type Props = {
  preview: FreeSamplePreview;
  className?: string;
};

export function FreeSampleBanner({ preview, className = '' }: Props) {
  const pathname = usePathname();
  const { pro, signedIn, loading } = useSubscription();

  if (loading || pro) return null;

  const hidden = Math.max(0, preview.total - preview.shown);

  return (
    <div className={`free-sample-banner ${className}`.trim()} role="status">
      <div className="free-sample-banner-head">
        <Eye className="free-sample-banner-icon h-4 w-4" aria-hidden />
        <div>
          <p className="free-sample-banner-kicker">Free tier sample</p>
          <p className="free-sample-banner-title">{formatSampleHeadline(preview)}</p>
        </div>
      </div>
      <p className="free-sample-banner-desc">{formatSamplePurpose(preview)}</p>
      {hidden > 0 && (
        <p className="free-sample-banner-unlock">
          <span className="font-medium">Pro unlocks:</span>{' '}
          {preview.proUnlocks.join(' · ')}
        </p>
      )}
      <div className="free-sample-banner-actions">
        {signedIn ? (
          <button
            type="button"
            className="finance-primary-btn py-1 text-xs"
            onClick={() => void startCheckout(pathname || '/pricing')}
          >
            Upgrade to Pro — $19/mo
          </button>
        ) : (
          <Link
            href={`/login?returnPathname=${encodeURIComponent(pathname || '/pricing')}`}
            className="finance-primary-btn py-1 text-xs"
          >
            Sign in to upgrade
          </Link>
        )}
        <Link href="/pricing" className="finance-secondary-btn py-1 text-xs">
          What&apos;s included
        </Link>
      </div>
    </div>
  );
}

export function FreeSampleBadge({ shown, total }: { shown: number; total: number }) {
  return (
    <span className="free-sample-badge" title="Free tier shows a limited sample of real results">
      Free sample · {shown} of {total.toLocaleString()}
    </span>
  );
}

export function FreeSampleTableFooter({
  preview,
  colSpan,
}: {
  preview: FreeSamplePreview;
  colSpan: number;
}) {
  const pathname = usePathname();
  const { pro, loading } = useSubscription();
  const hidden = preview.total - preview.shown;

  if (loading || pro || hidden <= 0) return null;

  return (
    <tfoot>
      <tr className="free-sample-table-footer">
        <td colSpan={colSpan}>
          <span>
            +{hidden.toLocaleString()} more {preview.unit} not shown on the free tier.
          </span>
          <Link href="/pricing" className="free-sample-table-footer-link">
            See Pro plans
          </Link>
        </td>
      </tr>
    </tfoot>
  );
}
