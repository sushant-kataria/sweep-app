'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';

type Props = {
  title?: string;
  description?: string;
  features?: string[];
};

export function AuthPrompt({
  title = 'Sign in to unlock',
  description = 'Pro features require a subscription. Sign in, then upgrade on the pricing page.',
  features = [
    'AI chat on reports and market data',
    'PDF & URL finance analysis',
    'Real estate screens & deal analyzer',
  ],
}: Props) {
  const pathname = usePathname();
  const loginHref = `/login?returnPathname=${encodeURIComponent(pathname || '/')}`;

  return (
    <div className="auth-prompt">
      <div className="auth-prompt-icon">
        <Lock className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h2 className="auth-prompt-title font-pixel">{title}</h2>
      <p className="auth-prompt-desc">{description}</p>
      {features.length > 0 && (
        <ul className="auth-prompt-list">
          {features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      <div className="auth-prompt-actions">
        <Link href={loginHref} className="finance-primary-btn text-sm">
          Sign in free
        </Link>
        <Link href="/pricing" className="finance-secondary-btn text-sm">
          View pricing
        </Link>
      </div>
    </div>
  );
}
