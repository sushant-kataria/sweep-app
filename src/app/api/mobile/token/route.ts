import { NextResponse } from 'next/server';

import { createMobileAccessToken } from '@/lib/mobile-token';
import { getSweepUser } from '@/lib/sweep-auth';

export const runtime = 'nodejs';

/**
 * Exchange a WorkOS cookie session for a bearer token the iOS app can store.
 * Called from /mobile/auth-complete after ASWebAuthenticationSession login.
 */
export async function POST() {
  const user = await getSweepUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    const accessToken = createMobileAccessToken(user);
    return NextResponse.json({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 60 * 60 * 24 * 30,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token mint failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
