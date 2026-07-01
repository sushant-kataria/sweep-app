import type { RealEstateScreen } from './types';

export const REAL_ESTATE_SCREENS: RealEstateScreen[] = [
  {
    id: 'high-yield',
    title: 'High yield ZIPs',
    description: 'ZIP codes with gross rental yield above their metro median.',
    formula: 'Gross yield > metro median yield',
    category: 'Income',
  },
  {
    id: 'price-dip',
    title: 'Price dip markets',
    description: 'ZIPs where median sale price fell year-over-year — potential value entry.',
    formula: 'Price YoY < 0%',
    category: 'Value',
  },
  {
    id: 'fast-movers',
    title: 'Fast movers',
    description: 'Low days-on-market ZIPs — homes selling quickly.',
    formula: 'Median DOM < 30 days',
    category: 'Momentum',
  },
  {
    id: 'rising-inventory',
    title: 'Rising inventory',
    description: 'ZIPs with growing supply — more buyer leverage.',
    formula: 'Inventory YoY > 10%',
    category: 'Supply',
  },
  {
    id: 'top-deals',
    title: 'Top deal scores',
    description: 'Highest composite deal scores across all tracked metros.',
    formula: 'Deal score ≥ 60 (top tier)',
    category: 'Composite',
  },
  {
    id: 'affordable-entry',
    title: 'Affordable entry',
    description: 'Lower-priced ZIPs under $400K median — starter investor markets.',
    formula: 'Median price < $400,000',
    category: 'Value',
  },
];

export function getRealEstateScreenById(id: string): RealEstateScreen | null {
  return REAL_ESTATE_SCREENS.find((s) => s.id === id) ?? null;
}

export function searchRealEstateScreens(query: string): RealEstateScreen[] {
  const q = query.trim().toLowerCase();
  if (!q) return REAL_ESTATE_SCREENS;
  return REAL_ESTATE_SCREENS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.formula.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q),
  );
}
