import { getTurso, isTursoConfigured } from '@/lib/turso';

export type SubscriptionRecord = {
  workosUserId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  priceId: string | null;
  currentPeriodEnd: string | null;
  updatedAt: string;
};

const PRO_STATUSES = new Set(['active', 'trialing']);

export function isActiveProStatus(status: string | null | undefined): boolean {
  return Boolean(status && PRO_STATUSES.has(status));
}

export async function getSubscription(workosUserId: string): Promise<SubscriptionRecord | null> {
  if (!isTursoConfigured()) return null;

  const db = getTurso();
  const result = await db.execute({
    sql: `SELECT workos_user_id, stripe_customer_id, stripe_subscription_id, status, price_id, current_period_end, updated_at
          FROM subscriptions WHERE workos_user_id = ? LIMIT 1`,
    args: [workosUserId],
  });

  const row = result.rows[0];
  if (!row) return null;

  return {
    workosUserId: String(row.workos_user_id),
    stripeCustomerId: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
    stripeSubscriptionId: row.stripe_subscription_id ? String(row.stripe_subscription_id) : null,
    status: String(row.status),
    priceId: row.price_id ? String(row.price_id) : null,
    currentPeriodEnd: row.current_period_end ? String(row.current_period_end) : null,
    updatedAt: String(row.updated_at),
  };
}

export async function isProUser(workosUserId: string): Promise<boolean> {
  const sub = await getSubscription(workosUserId);
  return isActiveProStatus(sub?.status);
}

export async function upsertSubscription(input: {
  workosUserId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status: string;
  priceId?: string | null;
  currentPeriodEnd?: string | null;
}): Promise<void> {
  if (!isTursoConfigured()) {
    console.warn('[subscription] Turso not configured — cannot persist subscription');
    return;
  }

  const db = getTurso();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO subscriptions (
            workos_user_id, stripe_customer_id, stripe_subscription_id, status, price_id, current_period_end, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(workos_user_id) DO UPDATE SET
            stripe_customer_id = COALESCE(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
            stripe_subscription_id = COALESCE(excluded.stripe_subscription_id, subscriptions.stripe_subscription_id),
            status = excluded.status,
            price_id = COALESCE(excluded.price_id, subscriptions.price_id),
            current_period_end = COALESCE(excluded.current_period_end, subscriptions.current_period_end),
            updated_at = excluded.updated_at`,
    args: [
      input.workosUserId,
      input.stripeCustomerId ?? null,
      input.stripeSubscriptionId ?? null,
      input.status,
      input.priceId ?? null,
      input.currentPeriodEnd ?? null,
      now,
    ],
  });
}

export async function findWorkosUserIdByStripeCustomer(stripeCustomerId: string): Promise<string | null> {
  if (!isTursoConfigured()) return null;

  const db = getTurso();
  const result = await db.execute({
    sql: `SELECT workos_user_id FROM subscriptions WHERE stripe_customer_id = ? LIMIT 1`,
    args: [stripeCustomerId],
  });

  const row = result.rows[0];
  return row ? String(row.workos_user_id) : null;
}
