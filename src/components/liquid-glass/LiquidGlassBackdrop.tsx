/** Solid shell fill — Vercel-style flat background (no blur, grain, or orbs). */
export function LiquidGlassBackdrop({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 bg-[var(--v-bg)]" aria-hidden />
  );
}
