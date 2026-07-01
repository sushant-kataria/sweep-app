'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type SweepSection = 'stock' | 'screens' | 'real-estate';

export const SWEEP_SECTIONS: { id: SweepSection; label: string; href: string }[] = [
  { id: 'stock', label: 'Stock', href: '/stock' },
  { id: 'screens', label: 'Stock screens', href: '/finance/explore' },
  { id: 'real-estate', label: 'Real Estate', href: '/real-estate' },
];

export type CompanySection = 'about' | 'pricing' | 'contact';

export const COMPANY_SECTIONS: { id: CompanySection; label: string; href: string }[] = [
  { id: 'about', label: 'About', href: '/about' },
  { id: 'pricing', label: 'Pricing', href: '/pricing' },
  { id: 'contact', label: 'Contact Us', href: '/contact' },
];

export function getActiveSection(pathname: string): SweepSection | null {
  if (pathname.startsWith('/stock')) return 'stock';
  if (pathname.startsWith('/finance')) return 'screens';
  if (pathname.startsWith('/real-estate')) return 'real-estate';
  return null;
}

export function getActiveCompanySection(pathname: string): CompanySection | null {
  if (pathname.startsWith('/about')) return 'about';
  if (pathname.startsWith('/pricing')) return 'pricing';
  if (pathname.startsWith('/contact')) return 'contact';
  return null;
}

export function navLinkClass(active: boolean) {
  return `font-pixel text-base leading-none tracking-normal sweep-header-nav-link${active ? ' sweep-header-nav-link--active' : ''}`;
}

type Props = {
  className?: string;
};

export function SweepHeaderNav({ className = '' }: Props) {
  const pathname = usePathname();
  const active = getActiveSection(pathname);

  return (
    <nav className={`sweep-header-nav${className ? ` ${className}` : ''}`} aria-label="Product sections">
      {SWEEP_SECTIONS.map(({ id, label, href }) => (
        <Link
          key={id}
          href={href}
          className={navLinkClass(active === id)}
          aria-current={active === id ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
