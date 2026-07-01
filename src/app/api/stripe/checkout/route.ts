import { NextResponse } from 'next/server';

import { getAppBaseUrl, getProPriceId, getStripe, isStripeConfigured } from '@/lib/stripe-server';
import { getSweepUser } from '@/lib/sweep-auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
  }

  const user = await getSweepUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required before checkout.' }, { status: 401 });
  }

  try {
    const base = getAppBaseUrl();
    const returnPath = new URL(req.url).searchParams.get('returnPath') ?? '/pricing';

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: getProPriceId(), quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: { workos_user_id: user.id },
      subscription_data: {
        metadata: { workos_user_id: user.id },
      },
      success_url: `${base}/pricing?success=1&returnPathname=${encodeURIComponent(returnPath)}`,
      cancel_url: `${base}/pricing?canceled=1`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Could not create checkout session.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed.';
    console.error('[stripe/checkout]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
