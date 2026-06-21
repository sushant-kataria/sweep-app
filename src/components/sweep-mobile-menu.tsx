'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Trash2, X } from 'lucide-react';
import {
  COMPANY_SECTIONS,
  SWEEP_EXPLORE_LINK,
  SWEEP_SECTIONS,
  getActiveCompanySection,
  getActiveSection,
} from '@/components/sweep-header-nav';

type ConvItem = {
  id: string;
  title: string;
  updatedAt: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  includeChat?: boolean;
  convs?: ConvItem[];
  currentConvId?: string;
  onSelectConv?: (id: string) => void;
  onNewConv?: () => void;
  onDeleteConv?: (id: string) => void;
};

export function SweepMobileMenu({
  open,
  onClose,
  includeChat = false,
  convs = [],
  currentConvId,
  onSelectConv,
  onNewConv,
  onDeleteConv,
}: Props) {
  const pathname = usePathname();
  const active = getActiveSection(pathname);
  const activeCompany = getActiveCompanySection(pathname);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[var(--v-fg)]/10 backdrop-blur-sm" onClick={onClose} />
      <div className="safe-top fixed bottom-0 left-0 top-0 z-50 flex w-full max-w-sm flex-col border-r border-[var(--v-border)] bg-[var(--v-bg)]">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--v-border)] px-4 py-3">
          <span className="font-pixel text-base text-[var(--v-fg)]">Menu</span>
          <button type="button" onClick={onClose} className="grok-ghost-btn" aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="finance-scroll flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-[var(--v-fg-5)]">
            Products
          </p>
          <nav className="sweep-mobile-menu-nav" aria-label="Product sections">
            {SWEEP_SECTIONS.map(({ id, label, href }) => (
              <Link
                key={id}
                href={href}
                onClick={onClose}
                className={`font-pixel sweep-mobile-nav-link${active === id ? ' sweep-mobile-nav-link--active' : ''}`}
                aria-current={active === id ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
            <Link
              href={SWEEP_EXPLORE_LINK.href}
              onClick={onClose}
              className={`font-pixel sweep-mobile-nav-link${pathname.startsWith('/finance/explore') ? ' sweep-mobile-nav-link--active' : ''}`}
            >
              {SWEEP_EXPLORE_LINK.label}
            </Link>
          </nav>

          <div className="mt-6 border-t border-[var(--v-border)] pt-4">
            <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-[var(--v-fg-5)]">
              Company
            </p>
            <nav className="sweep-mobile-menu-nav" aria-label="Company">
              {COMPANY_SECTIONS.map(({ id, label, href }) => (
                <Link
                  key={id}
                  href={href}
                  onClick={onClose}
                  className={`font-pixel sweep-mobile-nav-link${activeCompany === id ? ' sweep-mobile-nav-link--active' : ''}`}
                  aria-current={activeCompany === id ? 'page' : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {includeChat && (
            <div className="mt-6 border-t border-[var(--v-border)] pt-4">
              <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-[var(--v-fg-5)]">
                Chats
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNewConv?.();
                }}
                className="mb-3 flex w-full items-center gap-2 rounded-xl border border-[var(--v-border)] bg-[var(--v-surface)] px-3 py-2.5 text-sm font-medium text-[var(--v-fg)] transition-colors hover:bg-[var(--v-border)]"
              >
                <Plus className="h-4 w-4 text-[var(--v-fg-3)]" />
                New chat
              </button>

              <div className="space-y-1">
                {convs.length === 0 && (
                  <p className="py-6 text-center text-xs text-[var(--v-fg-4)]">No conversations yet</p>
                )}
                {convs.map((c) => (
                  <div
                    key={c.id}
                    className={`group relative flex items-center rounded-lg transition-colors ${
                      c.id === currentConvId
                        ? 'border border-[var(--v-border)] bg-[var(--v-surface)]'
                        : 'hover:bg-[var(--v-surface)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectConv?.(c.id);
                        onClose();
                      }}
                      className="min-w-0 flex-1 px-3 py-2.5 text-left"
                    >
                      <p className="truncate text-sm text-[var(--v-fg)]">{c.title}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--v-fg-4)]">
                        {new Date(c.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConv?.(c.id);
                      }}
                      className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--v-fg-5)] opacity-100 transition-all hover:text-[var(--v-fg-3)]"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {includeChat && (
          <p className="shrink-0 border-t border-[var(--v-border)] px-4 py-3 text-center text-[10px] text-[var(--v-fg-5)]">
            Chats saved in this browser for 5 minutes
          </p>
        )}
      </div>
    </>
  );
}