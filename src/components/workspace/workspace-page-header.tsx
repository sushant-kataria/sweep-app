'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Menu, Moon, Sun } from 'lucide-react';
import { AuthButton } from '@/components/auth/auth-button';
import { GlassSurface } from '@/components/ui/glass';
import { SweepMobileMenu } from '@/components/sweep-mobile-menu';
import { SweepHeaderNav } from '@/components/sweep-header-nav';
import { SweepLogo } from '@/components/sweep-logo';

type Props = {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  backHref?: string;
};

export function WorkspacePageHeader({ theme, onToggleTheme, backHref = '/' }: Props) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <GlassSurface as="header" className="finance-header safe-top grok-header sweep-glass-header">
        <div className="grok-header-inner">
          <div className="grok-header-slot grok-header-slot--left">
            <button
              type="button"
              onClick={() => setShowMenu(true)}
              className="grok-ghost-btn"
              aria-label="Open menu"
            >
              <Menu className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
            </button>
            <Link href={backHref} className="grok-ghost-btn" aria-label="Back to home">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link href="/" className="grok-header-home">
              <SweepLogo className="h-7 w-7" showWordmark={false} />
            </Link>
          </div>
          <div className="grok-header-slot grok-header-slot--center">
            <SweepHeaderNav />
          </div>
          <div className="grok-header-slot grok-header-slot--right">
            <AuthButton />
            <button type="button" onClick={onToggleTheme} className="grok-ghost-btn" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </GlassSurface>

      <SweepMobileMenu open={showMenu} onClose={() => setShowMenu(false)} />
    </>
  );
}