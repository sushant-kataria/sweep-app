/**
 * Shell backdrop only: neutral dark grays (dark theme) or white (light theme).
 * Subtle animated orbs for depth; optional grain. Glass controls stay in globals.css.
 */
export function LiquidGlassBackdrop({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div
      className={`liquid-glass-backdrop pointer-events-none absolute inset-0 z-0 overflow-hidden ${theme === 'dark' ? 'liquid-glass-backdrop--dark' : 'liquid-glass-backdrop--light'}`}
      aria-hidden
    >
      <div className="liquid-glass-gradient absolute inset-0" />
      <div className="liquid-glass-orbs">
        <div className="liquid-glass-orb liquid-glass-orb--navy" />
        <div className="liquid-glass-orb liquid-glass-orb--cobalt" />
        <div className="liquid-glass-orb liquid-glass-orb--teal" />
        <div className="liquid-glass-orb liquid-glass-orb--aqua" />
      </div>
      <div className="liquid-glass-grain absolute inset-0" />
    </div>
  );
}
