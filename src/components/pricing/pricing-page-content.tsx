'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { PRICING_FEATURES, STRIPE_PRO_PAYMENT_LINK } from '@/lib/pricing';

function FeatureCell({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Check className="pricing-feature-icon pricing-feature-icon--yes" aria-label="Included" />
  ) : (
    <X className="pricing-feature-icon pricing-feature-icon--no" aria-label="Not included" />
  );
}

async function startCheckout(returnPath: string): Promise<string | null> {
  const res = await fetch(`/api/stripe/checkout?returnPath=${encodeURIComponent(returnPath)}`, {
    method: 'POST',
  });
  const data = await res.json();
  if (data.url) return data.url;
  if (res.status === 401) return null;
  throw new Error(data.error ?? 'Checkout failed.');
}

async function openBillingPortal(): Promise<string | null> {
  const res = await fetch('/api/stripe/portal', { method: 'POST' });
  const data = await res.json();
  if (data.url) return data.url;
  throw new Error(data.error ?? 'Could not open billing portal.');
}

function PricingPageInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { loading, signedIn, pro, subscriptionStatus, refresh } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      void refresh();
    }
  }, [refresh, searchParams]);

  const handleUpgrade = async () => {
    setActionError('');
    setCheckoutLoading(true);
    try {
      const url = await startCheckout(pathname || '/pricing');
      if (url) {
        window.location.href = url;
        return;
      }
      window.location.href = `/login?returnPathname=${encodeURIComponent(pathname || '/pricing')}`;
    } catch (e) {
      if (STRIPE_PRO_PAYMENT_LINK) {
        window.open(STRIPE_PRO_PAYMENT_LINK, '_blank', 'noopener,noreferrer');
        return;
      }
      setActionError(e instanceof Error ? e.message : 'Checkout failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setActionError('');
    setPortalLoading(true);
    try {
      const url = await openBillingPortal();
      if (url) window.location.href = url;
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not open billing portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  const showSuccess = searchParams.get('success') === '1';
  const showCanceled = searchParams.get('canceled') === '1';

  return (
    <div className="pricing-page">
      <div className="pricing-hero">
        <p className="home-section-kicker font-mono">pricing</p>
        <h1 className="font-pixel text-2xl text-[var(--v-fg)] sm:text-3xl">Free to explore. Pro to work.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--v-fg-3)]">
          Browse stock and real estate markets on the free tier with sample previews. Upgrade to Pro for AI chat, custom
          filing analysis, full investor screens, deal tools, and exports — billed monthly via{' '}
          <a
            href="https://stripe.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            Stripe
          </a>
          .
        </p>
        {showSuccess && (
          <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
            Payment received — Pro access activates once Stripe confirms your subscription (usually within a minute).
          </p>
        )}
        {showCanceled && (
          <p className="mt-3 rounded-lg border border-[var(--v-border)] bg-[var(--v-surface)] px-3 py-2 text-sm text-[var(--v-fg-3)]">
            Checkout canceled. You can upgrade anytime.
          </p>
        )}
        {actionError && <p className="mt-3 text-sm text-red-500">{actionError}</p>}
      </div>

      <div className="pricing-cards pricing-cards--two">
        <article className="pricing-card">
          <h2 className="pricing-card-name font-pixel">Free</h2>
          <p className="pricing-card-price">
            <span className="font-pixel text-3xl">$0</span>
            <span className="text-sm text-[var(--v-fg-4)]"> / forever</span>
          </p>
          <p className="pricing-card-desc">
            Explore markets, screen catalogs, and preloaded finance demos — no account required.
          </p>
          <ul className="pricing-card-features">
            <li>Stock terminal & live charts</li>
            <li>Real estate metro & ZIP browser</li>
            <li>Preloaded SEC balance sheet demos (Top 25)</li>
            <li>5-row screen previews (stock & real estate)</li>
          </ul>
          <Link href="/stock" className="finance-secondary-btn mt-4 w-full text-center text-sm">
            Start free
          </Link>
        </article>

        <article className="pricing-card pricing-card--highlight">
          <span className="pricing-card-badge font-mono">{pro ? 'Active' : 'Stripe Checkout'}</span>
          <h2 className="pricing-card-name font-pixel">Pro</h2>
          <p className="pricing-card-price">
            <span className="font-pixel text-3xl">$19</span>
            <span className="text-sm text-[var(--v-fg-4)]"> / month</span>
          </p>
          <p className="pricing-card-desc">
            Full workspace — AI Q&A, custom reports, real estate screens, deal analyzer, and CSV/PDF export.
          </p>
          <ul className="pricing-card-features">
            <li>Everything in Free</li>
            <li>AI chat on finance, stock & real estate</li>
            <li>PDF upload, 10-K URLs & full investor screens</li>
          </ul>
          {loading ? (
            <button type="button" disabled className="finance-primary-btn mt-4 w-full text-center text-sm">
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            </button>
          ) : pro ? (
            <>
              <p className="mt-3 text-xs text-[var(--v-fg-4)]">
                Status: {subscriptionStatus ?? 'active'}
              </p>
              <button
                type="button"
                onClick={() => void handleManageBilling()}
                disabled={portalLoading}
                className="finance-primary-btn mt-4 w-full text-center text-sm"
              >
                {portalLoading ? 'Opening portal…' : 'Manage billing'}
              </button>
            </>
          ) : signedIn ? (
            <button
              type="button"
              onClick={() => void handleUpgrade()}
              disabled={checkoutLoading}
              className="finance-primary-btn mt-4 w-full text-center text-sm"
            >
              {checkoutLoading ? 'Redirecting…' : 'Upgrade to Pro'}
            </button>
          ) : (
            <Link
              href={`/login?returnPathname=${encodeURIComponent('/pricing')}`}
              className="finance-primary-btn mt-4 w-full text-center text-sm"
            >
              Sign in to upgrade
            </Link>
          )}
        </article>
      </div>

      <section className="pricing-compare">
        <h2 className="font-pixel text-lg text-[var(--v-fg)]">Feature comparison</h2>
        <div className="pricing-table-wrap">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th>Pro</th>
              </tr>
            </thead>
            <tbody>
              {PRICING_FEATURES.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>
                    <FeatureCell enabled={row.free} />
                  </td>
                  <td>
                    <FeatureCell enabled={row.pro} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pricing-stripe-note">
        <h2 className="font-pixel text-lg text-[var(--v-fg)]">Billing via Stripe</h2>
        <p className="text-sm leading-relaxed text-[var(--v-fg-3)]">
          Pro subscriptions are handled by Stripe Checkout — no monthly platform fee from Stripe, only per-charge
          processing (typically 2.9% + 30¢ in the US). Customers can manage billing through the Stripe customer portal.
        </p>
      </section>
    </div>
  );
}

export function PricingPageContent() {
  return (
    <Suspense fallback={<div className="pricing-page min-h-[40vh]" />}>
      <PricingPageInner />
    </Suspense>
  );
}
