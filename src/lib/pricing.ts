export type PricingFeature = {
  label: string;
  free: boolean;
  account: boolean;
  pro: boolean;
};

export const PRICING_FEATURES: PricingFeature[] = [
  { label: 'Stock terminal & live charts', free: true, account: true, pro: true },
  { label: 'Stock screens catalog (browse)', free: true, account: true, pro: true },
  { label: 'Real estate metro explorer (30 metros)', free: true, account: true, pro: true },
  { label: 'Preloaded finance demos (Top 25 filers)', free: true, account: true, pro: true },
  { label: 'AI chat Q&A (finance, stock, real estate)', free: false, account: true, pro: true },
  { label: 'Custom PDF upload & 10-K URL analysis', free: false, account: true, pro: true },
  { label: 'Real estate investor screens + CSV export', free: false, account: true, pro: true },
  { label: 'Deal analyzer (FRED mortgage rates)', free: false, account: true, pro: true },
  { label: 'Downloadable institutional PDF reports', free: false, account: true, pro: true },
  { label: 'Unlimited AI chat & priority generation', free: false, account: false, pro: true },
  { label: 'Saved workspaces & email alerts', free: false, account: false, pro: true },
  { label: 'API access (coming soon)', free: false, account: false, pro: true },
];

export const STRIPE_PRO_PAYMENT_LINK = process.env.NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK ?? '';
