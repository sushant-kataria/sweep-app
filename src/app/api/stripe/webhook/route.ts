import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { findWorkosUserIdByStripeCustomer, upsertSubscription } from '@/lib/subscription';
import { getStripe } from '@/lib/stripe-server';

export const runtime = 'nodejs';

function workosUserIdFromMetadata(metadata: Stripe.Metadata | null | undefined): string | null {
  const id = metadata?.workos_user_id?.trim();
  return id || null;
}

async function syncSubscription(subscription: Stripe.Subscription, workosUserId?: string | null) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  let userId = workosUserId ?? workosUserIdFromMetadata(subscription.metadata);

  if (!userId && customerId) {
    userId = await findWorkosUserIdByStripeCustomer(customerId);
  }

  if (!userId) {
    console.warn('[stripe/webhook] No WorkOS user for subscription', subscription.id);
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  await upsertSubscription({
    workosUserId: userId,
    stripeCustomerId: customerId ?? null,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    priceId,
    currentPeriodEnd: periodEnd,
  });
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.client_reference_id?.trim() || workosUserIdFromMetadata(session.metadata);
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;

        if (userId && customerId) {
          await upsertSubscription({
            workosUserId: userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: 'active',
          });
        }

        if (subscriptionId) {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          await syncSubscription(sub, userId);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('[stripe/webhook]', err);
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
