/**
 * Visual backdrop from Figma Make: Apple Liquid Glass UI Design
 * https://www.figma.com/make/j5uSWQrbH0XxgNUCsPFiOe/Apple-Liquid-Glass-UI-Design
 * (animated gradient + floating orbs, ported from FloatingOrbs + App shell)
 */
export function LiquidGlassBackdrop({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div
      className={`liquid-glass-backdrop pointer-events-none absolute inset-0 z-0 overflow-hidden ${theme === 'dark' ? 'liquid-glass-backdrop--dark' : 'liquid-glass-backdrop--light'}`}
      aria-hidden
    >
      <div className="liquid-glass-gradient absolute inset-0" />
      <div className="liquid-glass-orbs">
        <div className="liquid-glass-orb liquid-glass-orb--violet" />
        <div className="liquid-glass-orb liquid-glass-orb--blue" />
        <div className="liquid-glass-orb liquid-glass-orb--pink" />
        <div className="liquid-glass-orb liquid-glass-orb--cyan" />
      </div>
    </div>
  );
}
