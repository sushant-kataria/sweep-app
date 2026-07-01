'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { AuthPrompt } from '@/components/auth/auth-prompt';

type Props = {
  children: React.ReactNode;
  product: 'finance' | 'stock' | 'real-estate';
};

const COPY = {
  finance: {
    title: 'Sign in for report Q&A',
    description: 'AI chat on balance sheets and filings is included with a free account during beta.',
    features: ['Grounded answers from your active report', 'Liquidity, leverage, and risk analysis', 'See pricing for Pro limits'],
  },
  stock: {
    title: 'Sign in for equity Q&A',
    description: 'Ask questions about SEC fundamentals and live market context with a free account.',
    features: ['Grounded answers from XBRL tables', 'Peer and valuation questions', 'See pricing for Pro limits'],
  },
  'real-estate': {
    title: 'Sign in for market Q&A',
    description: 'Chat about ZIP metrics and deal assumptions with a free account.',
    features: ['Grounded real estate context', 'Investor screen follow-ups', 'See pricing for Pro limits'],
  },
};

export function ChatAuthGate({ children, product }: Props) {
  const { user, loading } = useAuth();
  const copy = COPY[product];

  if (loading) {
    return (
      <div className="finance-chat-placeholder">
        <p className="text-sm text-[var(--v-fg-3)]">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="finance-chat-panel-inner">
        <AuthPrompt title={copy.title} description={copy.description} features={copy.features} />
      </div>
    );
  }

  return children;
}
