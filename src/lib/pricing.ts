export type PricingFeature = {
  label: string;
  free: boolean;
  pro: boolean;
};

export const PRICING_FEATURES: PricingFeature[] = [
  { label: 'Stock terminal & live charts', free: true, pro: true },
  { label: 'Stock screens catalog (browse)', free: true, pro: true },
  { label: 'Real estate metro explorer (30 metros)', free: true, pro: true },
  { label: 'Preloaded finance demos (Top 25 filers)', free: true, pro: true },
  { label: 'Investor screen previews (5 rows)', free: true, pro: true },
  { label: 'Deal analyzer sample (read-only)', free: true, pro: true },
  { label: 'AI chat Q&A (finance, stock, real estate)', free: false, pro: true },
  { label: 'Custom PDF upload & 10-K URL analysis', free: false, pro: true },
  { label: 'Full investor screens + CSV export', free: false, pro: true },
  { label: 'Interactive deal analyzer', free: false, pro: true },
  { label: 'Downloadable institutional PDF reports', free: false, pro: true },
  { label: 'Unlimited AI chat & priority generation', free: false, pro: true },
  { label: 'Saved workspaces & email alerts (coming soon)', free: false, pro: true },
  { label: 'API access (coming soon)', free: false, pro: true },
];

export const STRIPE_PRO_PAYMENT_LINK = process.env.NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK ?? '';
