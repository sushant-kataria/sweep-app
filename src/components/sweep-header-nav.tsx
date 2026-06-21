'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type SweepSection = 'finance' | 'stock' | 'real-estate';

export const SWEEP_SECTIONS: { id: SweepSection; label: string; href: string }[] = [
  { id: 'finance', label: 'Finance', href: '/finance' },
  { id: 'stock', label: 'Stock', href: '/stock' },
  { id: 'real-estate', label: 'Real Estate', href: '/real-estate' },
];

/** Stock screens / explore — shown in mobile menu under Products. */
export const SWEEP_EXPLORE_LINK = { label: 'Stock screens', href: '/finance/explore' } as const;

export type CompanySection = 'about' | 'contact';

export const COMPANY_SECTIONS: { id: CompanySection; label: string; href: string }[] = [
  { id: 'about', label: 'About', href: '/about' },
  { id: 'contact', label: 'Contact Us', href: '/contact' },
];

export function getActiveSection(pathname: string): SweepSection | null {
  if (pathname.startsWith('/finance')) return 'finance';
  if (pathname.startsWith('/stock')) return 'stock';
  if (pathname.startsWith('/real-estate')) return 'real-estate';
  return null;
}

export function getActiveCompanySection(pathname: string): CompanySection | null {
  if (pathname.startsWith('/about')) return 'about';
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