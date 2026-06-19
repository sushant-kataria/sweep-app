'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@workos-inc/authkit-nextjs/components';

type Props = {
  className?: string;
  returnPathname?: string;
};

export function AuthButton({ className = 'grok-ghost-btn grok-ghost-btn--wide', returnPathname }: Props) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const returnTo = returnPathname ?? pathname ?? '/';

  if (loading) return null;

  if (!user) {
    const href = `/login?returnPathname=${encodeURIComponent(returnTo)}`;
    return (
      <Link href={href} className={`${className} font-pixel text-base leading-none tracking-normal sm:text-lg`}>
        Sign in
      </Link>
    );
  }

  const label = user.firstName ?? user.email?.split('@')[0] ?? 'Account';

  return (
    <div className="flex items-center gap-1">
      <span className="font-pixel hidden max-w-[7rem] truncate text-base leading-none tracking-normal text-[var(--v-fg-3)] sm:inline sm:text-lg">
        {label}
      </span>
      <Link href="/logout" className={`${className} font-pixel text-base leading-none tracking-normal sm:text-lg`}>
        Sign out
      </Link>
    </div>
  );
}