/**
 * Wallpaper-style backdrop — iOS & iPadOS 26 UI Kit (Apple Design Resources).
 * Cover palette: https://www.figma.com/design/DgPEQVTTV1rGxj1AQ3qBn7/iOS-and-iPadOS-26--Community-?node-id=221-56229
 * Home screen ref (Search / Dock glass): node 754-62883 — same file.
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
