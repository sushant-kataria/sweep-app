import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

export const GET = async (request: Request) => {
  const returnTo = new URL(request.url).searchParams.get('returnPathname') ?? '/';
  const signInUrl = await getSignInUrl({ returnTo });
  return redirect(signInUrl);
};