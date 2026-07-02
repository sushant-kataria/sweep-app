'use client';

import { ProGate } from '@/components/auth/pro-gate';

type Props = {
  children: React.ReactNode;
  product: 'finance' | 'stock' | 'real-estate';
};

const FEATURE_LABELS = {
  finance: 'Finance AI chat',
  stock: 'Stock AI chat',
  'real-estate': 'Real estate AI chat',
};

export function ChatAuthGate({ children, product }: Props) {
  return <ProGate feature={FEATURE_LABELS[product]}>{children}</ProGate>;
}
