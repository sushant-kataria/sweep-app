import { withAuth } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

export async function getSweepUser() {
  const { user } = await withAuth({ ensureSignedIn: false });
  return user;
}

export async function requireSweepUser(returnPath: string) {
  const user = await getSweepUser();
  if (!user) {
    redirect(`/login?returnPathname=${encodeURIComponent(returnPath)}`);
  }
  return user;
}

export async function requireSweepUserApi() {
  return getSweepUser();
}
