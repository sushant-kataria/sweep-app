'use client';

import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { PRICING_FEATURES, STRIPE_PRO_PAYMENT_LINK } from '@/lib/pricing';

function FeatureCell({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Check className="pricing-feature-icon pricing-feature-icon--yes" aria-label="Included" />
  ) : (
    <X className="pricing-feature-icon pricing-feature-icon--no" aria-label="Not included" />
  );
}

export function PricingPageContent() {
  const { user } = useAuth();
  const proHref = STRIPE_PRO_PAYMENT_LINK || `/login?returnPathname=${encodeURIComponent('/pricing')}`;

  return (
    <div className="pricing-page">
      <div className="pricing-hero">
        <p className="home-section-kicker font-mono">pricing</p>
        <h1 className="font-pixel text-2xl text-[var(--v-fg)] sm:text-3xl">Simple tiers. Free data sources.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--v-fg-3)]">
          Browse stock and real estate markets for free. Sign in to unlock AI chat, custom filing analysis, investor
          screens, and the deal analyzer — no credit card during beta. Pro billing runs on{' '}
          <a
            href="https://stripe.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            Stripe
          </a>{' '}
          (free to integrate; pay only when you charge subscribers).
        </p>
      </div>

      <div className="pricing-cards">
        <article className="pricing-card">
          <h2 className="pricing-card-name font-pixel">Free</h2>
          <p className="pricing-card-price">
            <span className="font-pixel text-3xl">$0</span>
            <span className="text-sm text-[var(--v-fg-4)]"> / forever</span>
          </p>
          <p className="pricing-card-desc">Explore markets and preloaded demos without an account.</p>
          <Link href="/stock" className="finance-secondary-btn mt-4 w-full text-center text-sm">
            Start browsing
          </Link>
        </article>

        <article className="pricing-card pricing-card--highlight">
          <span className="pricing-card-badge font-mono">Beta · free with sign-in</span>
          <h2 className="pricing-card-name font-pixel">Account</h2>
          <p className="pricing-card-price">
            <span className="font-pixel text-3xl">$0</span>
            <span className="text-sm text-[var(--v-fg-4)]"> / with sign-in</span>
          </p>
          <p className="pricing-card-desc">All Pro tools unlocked while we&apos;re in beta — just create an account.</p>
          {user ? (
            <p className="mt-4 text-center text-sm text-[var(--v-fg-3)]">Signed in as {user.email}</p>
          ) : (
            <Link
              href={`/login?returnPathname=${encodeURIComponent('/pricing')}`}
              className="finance-primary-btn mt-4 w-full text-center text-sm"
            >
              Sign in free
            </Link>
          )}
        </article>

        <article className="pricing-card">
          <span className="pricing-card-badge font-mono">Stripe Checkout</span>
          <h2 className="pricing-card-name font-pixel">Pro</h2>
          <p className="pricing-card-price">
            <span className="font-pixel text-3xl">$19</span>
            <span className="text-sm text-[var(--v-fg-4)]"> / month</span>
          </p>
          <p className="pricing-card-desc">Unlimited AI, priority reports, and team features — billed via Stripe.</p>
          <a
            href={proHref}
            className="finance-primary-btn mt-4 w-full text-center text-sm"
            {...(STRIPE_PRO_PAYMENT_LINK ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {STRIPE_PRO_PAYMENT_LINK ? 'Upgrade with Stripe' : 'Sign in to join waitlist'}
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
                <th>Account</th>
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
                    <FeatureCell enabled={row.account} />
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
        <h2 className="font-pixel text-lg text-[var(--v-fg)]">Why Stripe?</h2>
        <p className="text-sm leading-relaxed text-[var(--v-fg-3)]">
          Stripe has no monthly platform fee — you only pay per successful charge (2.9% + 30¢ in the US). We use Stripe
          Checkout and the Customer Portal for subscriptions, invoices, and self-serve billing. Alternatives like Lemon
          Squeezy work too if you need merchant-of-record tax handling; Stripe is our default for direct subscriptions.
        </p>
        <p className="mt-2 text-xs text-[var(--v-fg-5)]">
          Set <code className="font-mono">NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK</code> to your Stripe Payment Link to
          enable one-click Pro upgrades.
        </p>
      </section>
    </div>
  );
}
