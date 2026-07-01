'use client';

import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { PRICING_FEATURES, STRIPE_PRO_PAYMENT_LINK } from '@/lib/pricing';

function FeatureCell({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Check className="pricing-feature-icon pricing-feature-icon--yes" aria-label="Included" />
  ) : (
    <X className="pricing-feature-icon pricing-feature-icon--no" aria-label="Not included" />
  );
}

export function PricingPageContent() {
  const proHref = STRIPE_PRO_PAYMENT_LINK || `/login?returnPathname=${encodeURIComponent('/pricing')}`;

  return (
    <div className="pricing-page">
      <div className="pricing-hero">
        <p className="home-section-kicker font-mono">pricing</p>
        <h1 className="font-pixel text-2xl text-[var(--v-fg)] sm:text-3xl">Free to explore. Pro to work.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--v-fg-3)]">
          Browse stock and real estate markets on the free tier. Upgrade to Pro for AI chat, custom filing analysis,
          investor screens, deal tools, and exports — billed monthly via{' '}
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
            <li>Preloaded SEC balance sheet demos</li>
          </ul>
          <Link href="/stock" className="finance-secondary-btn mt-4 w-full text-center text-sm">
            Start free
          </Link>
        </article>

        <article className="pricing-card pricing-card--highlight">
          <span className="pricing-card-badge font-mono">Stripe Checkout</span>
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
            <li>PDF upload, 10-K URLs & investor screens</li>
          </ul>
          <a
            href={proHref}
            className="finance-primary-btn mt-4 w-full text-center text-sm"
            {...(STRIPE_PRO_PAYMENT_LINK ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {STRIPE_PRO_PAYMENT_LINK ? 'Upgrade to Pro' : 'Sign in to upgrade'}
          </a>
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
