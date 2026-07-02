import { NextResponse } from 'next/server';

import { getStripe, isStripeConfigured } from '@/lib/stripe-server';
import { getSubscription } from '@/lib/subscription';
import { getSweepUser } from '@/lib/sweep-auth';

export const runtime = 'nodejs';

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
  }

  const user = await getSweepUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  try {
    const sub = await getSubscription(user.id);
    if (!sub?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer on file. Subscribe to Pro first.' }, { status: 400 });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://sweep-app.vercel.app'}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe/portal]', err);
    return NextResponse.json({ error: 'Could not open billing portal.' }, { status: 500 });
  }
}
