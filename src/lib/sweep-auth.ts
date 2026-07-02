import { withAuth } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import type { User } from '@workos-inc/node';

import { isProUser } from '@/lib/subscription';

export async function getSweepUser(): Promise<User | null> {
  const { user } = await withAuth({ ensureSignedIn: false });
  return user;
}

export async function requireSweepUser(returnPath: string): Promise<User> {
  const user = await getSweepUser();
  if (!user) {
    redirect(`/login?returnPathname=${encodeURIComponent(returnPath)}`);
  }
  return user;
}

export async function requireProUser(returnPath: string): Promise<User> {
  const user = await requireSweepUser(returnPath);
  const pro = await isProUser(user.id);
  if (!pro) {
    redirect(`/pricing?upgrade=1&returnPathname=${encodeURIComponent(returnPath)}`);
  }
  return user;
}

export async function getProStatusForUser(user: User | null) {
  if (!user) return { signedIn: false as const, pro: false };
  const pro = await isProUser(user.id);
  return { signedIn: true as const, pro, userId: user.id, email: user.email };
}

export async function requireProUserApi(): Promise<User | null> {
  const user = await getSweepUser();
  if (!user) return null;
  const pro = await isProUser(user.id);
  return pro ? user : null;
}

export async function requireSignedInApi(): Promise<User | null> {
  return getSweepUser();
}
