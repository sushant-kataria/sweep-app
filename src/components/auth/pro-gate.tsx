'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';

type Props = {
  children: React.ReactNode;
  feature?: string;
};

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

export function ProGate({ children, feature = 'This feature' }: Props) {
  const pathname = usePathname();
  const { loading, signedIn, pro } = useSubscription();

  if (loading) {
    return (
      <div className="finance-chat-placeholder flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-[var(--v-fg-3)]">Loading…</span>
      </div>
    );
  }

  if (pro) return children;

  return (
    <div className="auth-prompt">
      <h2 className="auth-prompt-title font-pixel">{signedIn ? 'Upgrade to Pro' : 'Sign in & upgrade'}</h2>
      <p className="auth-prompt-desc">
        {feature} is included with Sweep Pro ($19/mo). Browse free samples first, then upgrade when you&apos;re ready.
      </p>
      <div className="auth-prompt-actions">
        {signedIn ? (
          <button
            type="button"
            className="finance-primary-btn text-sm"
            onClick={() => void startCheckout(pathname || '/pricing')}
          >
            Upgrade to Pro
          </button>
        ) : (
          <Link
            href={`/login?returnPathname=${encodeURIComponent(pathname || '/pricing')}`}
            className="finance-primary-btn text-sm"
          >
            Sign in
          </Link>
        )}
        <Link href="/pricing" className="finance-secondary-btn text-sm">
          View pricing
        </Link>
      </div>
    </div>
  );
}

export function PreviewBanner({ scanNote }: { scanNote?: string }) {
  const pathname = usePathname();
  const { pro, signedIn, loading } = useSubscription();

  if (loading || pro || !scanNote) return null;

  return (
    <div className="free-sample-banner mb-4" role="status">
      <p className="free-sample-banner-desc !mt-0">{scanNote}</p>
      <div className="free-sample-banner-actions !mt-2">
        {signedIn ? (
          <button
            type="button"
            className="finance-primary-btn py-1 text-xs"
            onClick={() => void startCheckout(pathname || '/pricing')}
          >
            Upgrade to Pro
          </button>
        ) : (
          <Link href={`/login?returnPathname=${encodeURIComponent(pathname || '/pricing')}`} className="finance-primary-btn py-1 text-xs">
            Sign in to upgrade
          </Link>
        )}
        <Link href="/pricing" className="finance-secondary-btn py-1 text-xs">
          Compare plans
        </Link>
      </div>
    </div>
  );
}
