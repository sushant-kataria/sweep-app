import { NextResponse } from 'next/server';

import { getProStatusForUser, getSweepUser } from '@/lib/sweep-auth';
import { getSubscription, isActiveProStatus } from '@/lib/subscription';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getSweepUser();
  const status = await getProStatusForUser(user);
  const subscription = user ? await getSubscription(user.id) : null;

  return NextResponse.json({
    signedIn: status.signedIn,
    pro: status.pro,
    email: user?.email ?? null,
    subscriptionStatus: subscription?.status ?? null,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    isActivePro: isActiveProStatus(subscription?.status),
  });
}
